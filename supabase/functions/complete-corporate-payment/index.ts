import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * 기업 결제 완료 처리 (PortOne V2)
 * - V2 REST API로 결제 검증
 * - 금액 위변조 방지
 * - 자동 VN 토큰 지급 / 공급자 보상 분배
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, paymentId, purchaseId } = await req.json();

    // 주문 조회
    const { data: order, error: orderError } = await supabaseClient
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: '주문을 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PortOne V2 API로 결제 검증
    let paymentVerified = false;
    let paidAmount = 0;

    if (paymentId) {
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

      if (paymentRes.ok) {
        const paymentInfo = await paymentRes.json();
        paidAmount = paymentInfo.amount?.total || 0;

        if (paymentInfo.status === 'PAID' && paidAmount === order.total_amount) {
          paymentVerified = true;
        } else if (paidAmount !== order.total_amount) {
          console.error(`Amount mismatch: expected ${order.total_amount}, got ${paidAmount}`);

          // 위변조 → 자동 취소
          try {
            await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`, {
              method: 'POST',
              headers: {
                'Authorization': `PortOne ${apiSecret}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ reason: '금액 위변조 감지 자동 취소' }),
            });
          } catch (e) {
            console.error('Auto-cancel failed:', e);
          }

          await adminClient
            .from('payment_orders')
            .update({
              status: 'fraud_detected',
              pg_transaction_id: paymentId,
              metadata: {
                ...(order.metadata as any),
                fraud_detected: true,
                expected_amount: order.total_amount,
                actual_amount: paidAmount,
              },
            })
            .eq('id', orderId);

          return new Response(
            JSON.stringify({ error: '결제 금액이 일치하지 않습니다. 자동 취소되었습니다.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.error('PortOne V2 verification failed:', paymentRes.status);
      }
    }

    if (!paymentVerified) {
      return new Response(
        JSON.stringify({ error: '결제 검증에 실패했습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 결제 성공 처리
    await adminClient
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        pg_provider: 'portone_v2',
        pg_transaction_id: paymentId,
      })
      .eq('id', orderId);

    // 데이터 구매 상태 업데이트
    if (purchaseId) {
      await adminClient
        .from('data_purchases')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', purchaseId);
    }

    // 세금계산서 발행
    const metadata = order.metadata as any;
    if (metadata?.need_tax_invoice && order.corporate_account_id) {
      const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      await adminClient.from('invoices').insert({
        corporate_account_id: order.corporate_account_id,
        purchase_id: purchaseId,
        invoice_number: invoiceNumber,
        issue_date: new Date().toISOString().split('T')[0],
        supply_amount: order.amount,
        vat_amount: order.vat_amount,
        total_amount: order.total_amount,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        items: [{
          description: metadata?.product_title || 'VeriNode 데이터 구매',
          quantity: 1,
          unit_price: order.amount,
          amount: order.amount,
        }],
      });
    }

    // 공급자 보상 분배
    if (purchaseId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        await fetch(`${supabaseUrl}/functions/v1/match-and-distribute-rewards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ purchaseId }),
        });
      } catch (distError) {
        console.error('Distribution trigger error:', distError);
      }
    }

    // 결제 완료 알림
    await adminClient.from('notifications').insert({
      user_id: user.id,
      type: 'payment',
      title: '✅ 결제 완료',
      message: `₩${order.total_amount.toLocaleString()} 결제가 완료되었습니다. 데이터 수집이 시작됩니다.`,
      metadata: { order_id: orderId, purchase_id: purchaseId },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Complete corporate payment error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
