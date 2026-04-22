import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentOrderRequest {
  amount: number;
  orderName: string;
  paymentMethod: string;
  isSubscription?: boolean;
  customData?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 인증 헤더 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: PaymentOrderRequest = await req.json();
    const { amount, orderName, paymentMethod, isSubscription, customData } = body;

    // 금액 검증
    if (!amount || amount < 1000) {
      return new Response(
        JSON.stringify({ error: '최소 결제 금액은 1,000원입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 고유 주문번호 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const merchantUid = `order_${timestamp}_${randomStr}`;

    // 구독용 고객 식별자 (빌링키 발급용)
    const customerUid = isSubscription ? `customer_${user.id}_${timestamp}` : null;

    // VAT 계산 (10%)
    const vatAmount = Math.round(amount * 0.1);
    const supplyAmount = amount - vatAmount;

    // 결제 주문 생성
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        user_id: user.id,
        order_type: isSubscription ? 'subscription' : 'one_time',
        amount: supplyAmount,
        vat_amount: vatAmount,
        total_amount: amount,
        status: 'pending',
        payment_method: paymentMethod,
        metadata: {
          merchantUid,
          customerUid,
          orderName,
          ...customData,
        },
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return new Response(
        JSON.stringify({ error: '주문 생성에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        merchantUid,
        customerUid,
        amount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create payment order error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
