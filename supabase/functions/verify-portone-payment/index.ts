import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * PortOne V2 결제 검증 Edge Function
 * - V2 REST API 사용: GET https://api.portone.io/payments/{paymentId}
 * - Authorization: PortOne ${API_SECRET}
 */
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

    const { paymentId, expectedAmount } = await req.json();

    if (!paymentId || !expectedAmount) {
      return new Response(
        JSON.stringify({ error: 'paymentId와 expectedAmount가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PortOne V2 API로 결제 정보 조회
    const apiSecret = Deno.env.get('PORTONE_API_SECRET');
    if (!apiSecret) {
      console.error('CRITICAL: PORTONE_API_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'PG사 연동 오류' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `PortOne ${apiSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!paymentRes.ok) {
      const errBody = await paymentRes.text();
      console.error('PortOne V2 payment lookup failed:', paymentRes.status, errBody);
      return new Response(
        JSON.stringify({ error: '결제 정보를 조회할 수 없습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentInfo = await paymentRes.json();

    // 결제 상태 확인 (V2: status = "PAID")
    if (paymentInfo.status !== 'PAID') {
      await supabase
        .from('payment_orders')
        .update({ status: 'failed', pg_transaction_id: paymentId })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      return new Response(
        JSON.stringify({ error: '결제가 완료되지 않았습니다', status: paymentInfo.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 금액 위변조 검증
    const paidAmount = paymentInfo.amount?.total;
    if (paidAmount !== expectedAmount) {
      console.error(`FRAUD DETECTED: expected ${expectedAmount}, got ${paidAmount}`);

      // 위변조 감지 → 자동 취소 시도
      try {
        await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `PortOne ${apiSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: '금액 위변조 감지 자동 취소' }),
        });
      } catch (cancelErr) {
        console.error('Auto-cancel failed:', cancelErr);
      }

      await supabase
        .from('payment_orders')
        .update({
          status: 'fraud_detected',
          pg_transaction_id: paymentId,
          metadata: {
            fraud_detected: true,
            expected_amount: expectedAmount,
            actual_amount: paidAmount,
          },
        })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      return new Response(
        JSON.stringify({ error: '결제 금액이 일치하지 않습니다. 자동 취소되었습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 결제 성공 — DB 업데이트
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        pg_provider: 'portone_v2',
        pg_transaction_id: paymentId,
      })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Order update error:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        paidAmount,
        status: 'paid',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verify payment error:', error);
    return new Response(
      JSON.stringify({ error: '결제 검증 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
