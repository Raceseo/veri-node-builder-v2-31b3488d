import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const portoneApiKey = Deno.env.get('PORTONE_API_KEY');
    const portoneApiSecret = Deno.env.get('PORTONE_API_SECRET');
    const environment = Deno.env.get('ENVIRONMENT') || 'production';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 만료 예정 구독 조회 (오늘 또는 내일 만료)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('next_billing_date', tomorrow.toISOString().split('T')[0])
      .gte('next_billing_date', today.toISOString().split('T')[0]);

    if (subError) {
      console.error('Subscription query error:', subError);
      return new Response(
        JSON.stringify({ error: '구독 조회 실패' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions to renew');
      return new Response(
        JSON.stringify({ success: true, message: '갱신할 구독이 없습니다', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PortOne API 토큰 발급
    let portoneAccessToken = null;
    if (portoneApiKey && portoneApiSecret) {
      // Real PortOne token flow
      try {
        const tokenResponse = await fetch('https://api.iamport.kr/users/getToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imp_key: portoneApiKey,
            imp_secret: portoneApiSecret,
          }),
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.code === 0) {
          portoneAccessToken = tokenData.response.access_token;
        }
      } catch (e) {
        console.error('PortOne token error:', e);
      }
    } else if (environment !== 'development' && environment !== 'test') {
      console.error('CRITICAL: PortOne API keys not configured in production');
      return new Response(
        JSON.stringify({ error: '결제 게이트웨이가 설정되지 않았습니다', processed: 0 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    const MAX_RETRY = 3;

    for (const subscription of subscriptions) {
      const { id, user_id, customer_uid, amount, plan_type, retry_count = 0 } = subscription;
      
      let paymentSuccess = false;
      let errorMessage = '';

      // 빌링키가 있고 PortOne 토큰이 있으면 자동 결제 시도
      if (customer_uid && portoneAccessToken) {
        const merchantUid = `renewal_${id}_${Date.now()}`;
        
        try {
          const paymentResponse = await fetch('https://api.iamport.kr/subscribe/payments/again', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${portoneAccessToken}`,
            },
            body: JSON.stringify({
              customer_uid: customer_uid,
              merchant_uid: merchantUid,
              amount: amount,
              name: `VeriNode ${plan_type} 멤버십 갱신`,
            }),
          });

          const paymentData = await paymentResponse.json();
          paymentSuccess = paymentData.code === 0 && paymentData.response?.status === 'paid';
          
          if (!paymentSuccess) {
            errorMessage = paymentData.message || '결제 실패';
            console.error('Renewal payment failed:', paymentData);
          }
        } catch (e) {
          errorMessage = '결제 요청 중 오류';
          console.error('Renewal payment error:', e);
        }
      } else {
        errorMessage = '빌링키 또는 API 토큰 없음';
      }

      if (paymentSuccess) {
        // 성공: 다음 결제일 업데이트
        const nextBillingDate = new Date(subscription.next_billing_date);
        const billingCycle = subscription.billing_cycle || 'monthly';
        
        if (billingCycle === 'yearly') {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }

        await supabase
          .from('subscriptions')
          .update({
            next_billing_date: nextBillingDate.toISOString().split('T')[0],
            last_billing_date: new Date().toISOString().split('T')[0],
            retry_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        // 결제 주문 기록
        await supabase
          .from('payment_orders')
          .insert({
            user_id: user_id,
            order_type: 'subscription',
            amount: Math.round(amount * 0.909), // VAT 제외
            vat_amount: Math.round(amount * 0.091),
            total_amount: amount,
            status: 'completed',
            payment_method: 'billing_key',
            paid_at: new Date().toISOString(),
            metadata: { subscription_id: id, plan_type },
          });

        // 성공 알림
        await supabase
          .from('notifications')
          .insert({
            user_id: user_id,
            type: 'payment',
            title: '멤버십 자동 갱신 완료',
            message: `${plan_type} 멤버십이 갱신되었습니다. (${amount.toLocaleString()}원)`,
            metadata: { subscription_id: id },
          });

        results.push({ id, status: 'success' });
      } else {
        // 실패: 재시도 카운트 증가
        const newRetryCount = retry_count + 1;

        if (newRetryCount >= MAX_RETRY) {
          // 3회 실패: 구독 일시정지
          await supabase
            .from('subscriptions')
            .update({
              status: 'paused',
              retry_count: newRetryCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          // 일시정지 알림
          await supabase
            .from('notifications')
            .insert({
              user_id: user_id,
              type: 'warning',
              title: '⚠️ 멤버십 결제 실패',
              message: '결제가 3회 연속 실패하여 멤버십이 일시정지되었습니다. 결제 수단을 확인해주세요.',
              metadata: { subscription_id: id, error: errorMessage },
            });

          results.push({ id, status: 'paused', error: errorMessage });
        } else {
          // 재시도 대기
          await supabase
            .from('subscriptions')
            .update({
              retry_count: newRetryCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          // 재시도 알림
          await supabase
            .from('notifications')
            .insert({
              user_id: user_id,
              type: 'warning',
              title: '결제 재시도 예정',
              message: `멤버십 결제가 실패했습니다. (${newRetryCount}/${MAX_RETRY}회) 잠시 후 재시도됩니다.`,
              metadata: { subscription_id: id, retry_count: newRetryCount },
            });

          results.push({ id, status: 'retry', retryCount: newRetryCount, error: errorMessage });
        }
      }
    }

    console.log('Subscription renewal completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: subscriptions.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Subscription renewal error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
