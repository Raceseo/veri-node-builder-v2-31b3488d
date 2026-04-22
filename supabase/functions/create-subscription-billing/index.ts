import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionBillingRequest {
  impUid: string;
  merchantUid: string;
  customerUid: string;
  planType: string;
  billingCycle: 'monthly' | 'yearly';
}

// 플랜별 가격 정의
const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  basic: { monthly: 9900, yearly: 95040 },
  pro: { monthly: 29900, yearly: 287040 },
  enterprise: { monthly: 99900, yearly: 959040 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 사용자 인증 확인
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SubscriptionBillingRequest = await req.json();
    const { impUid, merchantUid, customerUid, planType, billingCycle } = body;

    // 플랜 가격 확인
    const planPrices = PLAN_PRICES[planType];
    if (!planPrices) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 플랜입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const price = billingCycle === 'yearly' ? planPrices.yearly : planPrices.monthly;

    // 다음 결제일 계산
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7일 무료 체험

    const nextBillingDate = new Date(trialEndDate);
    if (billingCycle === 'yearly') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    // 기존 구독 확인 및 취소
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('status', 'active');

    // 새 구독 생성
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_type: planType,
        billing_cycle: billingCycle,
        price,
        status: 'trial', // 7일 무료 체험
        started_at: now.toISOString(),
        expires_at: trialEndDate.toISOString(),
        next_billing_at: trialEndDate.toISOString(), // 체험 종료 후 첫 결제
        billing_key_encrypted: customerUid, // 실제로는 암호화 필요
        payment_method: 'card',
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
      return new Response(
        JSON.stringify({ error: '구독 생성에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 결제 주문 상태 업데이트
    await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        pg_provider: 'portone',
        pg_transaction_id: impUid,
      })
      .eq('metadata->merchantUid', merchantUid);

    // 알림 생성
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'subscription',
      title: '🎉 멤버십 가입 완료!',
      message: `${planType.toUpperCase()} 멤버십이 활성화되었습니다. 7일간 무료로 이용해보세요!`,
      metadata: {
        subscriptionId: subscription.id,
        planType,
        billingCycle,
        trialEndDate: trialEndDate.toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: subscription.id,
        planType,
        status: 'trial',
        trialEndDate: trialEndDate.toISOString(),
        nextBillingDate: trialEndDate.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create subscription billing error:', error);
    return new Response(
      JSON.stringify({ error: '구독 처리 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
