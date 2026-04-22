import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * PortOne V2 Webhook Handler
 * - V2 웹훅 페이로드: { type, timestamp, data: { paymentId, transactionId, ... } }
 * - V2 REST API로 결제 정보 조회: GET https://api.portone.io/payments/{paymentId}
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // V2 웹훅 페이로드 파싱
    const webhookType = body.type; // e.g. "Transaction.Paid", "Transaction.Cancelled", "Transaction.Failed"
    const paymentId = body.data?.paymentId;
    const transactionId = body.data?.transactionId;

    console.log('[Webhook V2] Received:', { webhookType, paymentId, transactionId });

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'paymentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PortOne V2 API로 실제 결제 정보 조회
    const apiSecret = Deno.env.get('PORTONE_API_SECRET');
    if (!apiSecret) {
      console.error('CRITICAL: PORTONE_API_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
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
      console.error('Payment lookup failed:', paymentRes.status, errBody);
      return new Response(
        JSON.stringify({ received: true, warning: 'Payment lookup failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payment = await paymentRes.json();
    const pgStatus = payment.status; // PAID, CANCELLED, FAILED, READY, etc.
    const paidAmount = payment.amount?.total;

    // DB에서 주문 조회 (paymentId = pg_transaction_id 또는 metadata의 merchant_uid)
    let order: any = null;

    // pg_transaction_id로 검색
    const { data: orders1 } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('pg_transaction_id', paymentId);

    order = orders1?.[0];

    // 못 찾으면 pending 상태에서 metadata로 검색
    if (!order) {
      const { data: pendingOrders } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('status', 'pending');

      order = pendingOrders?.find((o: any) => {
        const meta = o.metadata as any;
        return meta?.merchantUid === paymentId || meta?.merchant_uid === paymentId;
      });
    }

    if (!order) {
      console.warn('[Webhook V2] Order not found for paymentId:', paymentId);
      return new Response(
        JSON.stringify({ received: true, warning: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 금액 위변조 검증
    if (pgStatus === 'PAID' && paidAmount !== order.total_amount) {
      console.error(`[Webhook V2] FRAUD: expected ${order.total_amount}, got ${paidAmount}`);

      // 자동 취소 시도
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

      await supabase
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
        .eq('id', order.id);

      return new Response(
        JSON.stringify({ received: true, status: 'fraud_detected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 상태별 처리
    switch (pgStatus) {
      case 'PAID': {
        if (order.status === 'paid') {
          return new Response(
            JSON.stringify({ received: true, status: 'already_processed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('payment_orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            pg_provider: 'portone_v2',
            pg_transaction_id: paymentId,
          })
          .eq('id', order.id);

        // VN 토큰 충전 주문
        if (order.order_type === 'vn_charge') {
          const meta = order.metadata as any;
          const vnAmount = meta?.vnAmount || Math.floor(paidAmount);
          const bonusVN = meta?.bonusVN || 0;
          const totalVN = vnAmount + bonusVN;

          const { data: profile } = await supabase
            .from('profiles')
            .select('vn_balance')
            .eq('id', order.user_id)
            .single();

          const currentBalance = profile?.vn_balance || 0;
          const newBalance = currentBalance + totalVN;

          await supabase.from('profiles')
            .update({ vn_balance: newBalance, updated_at: new Date().toISOString() })
            .eq('id', order.user_id);

          await supabase.from('vn_charge_records').insert({
            user_id: order.user_id,
            payment_order_id: order.id,
            krw_amount: paidAmount,
            vn_amount: vnAmount,
            bonus_vn: bonusVN,
            total_vn: totalVN,
          });

          await supabase.from('transactions').insert({
            user_id: order.user_id,
            type: 'charge',
            amount: totalVN,
            balance_before: currentBalance,
            balance_after: newBalance,
            description: `VN 토큰 충전 ₩${paidAmount.toLocaleString()}`,
            reference_type: 'vn_charge',
            reference_id: order.id,
            status: 'completed',
          });
        }

        // 데이터 구매 주문
        if (order.order_type === 'data_purchase') {
          const meta = order.metadata as any;
          const purchaseId = meta?.purchase_id || meta?.purchaseId;

          if (purchaseId) {
            await supabase.from('data_purchases')
              .update({ status: 'paid', paid_at: new Date().toISOString() })
              .eq('id', purchaseId);

            try {
              await fetch(`${supabaseUrl}/functions/v1/match-and-distribute-rewards`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({ purchaseId }),
              });
            } catch (e) {
              console.error('[Webhook V2] Reward distribution error:', e);
            }
          }
        }

        // 결제 완료 알림
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: 'payment',
          title: '✅ 결제 완료',
          message: `₩${paidAmount.toLocaleString()} 결제가 완료되었습니다.`,
          metadata: { order_id: order.id, paymentId, amount: paidAmount },
        });

        console.log('[Webhook V2] Payment completed:', order.id);
        break;
      }

      case 'CANCELLED': {
        await supabase
          .from('payment_orders')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('id', order.id);

        const cancelAmount = payment.cancellations?.[0]?.totalAmount || paidAmount;

        await supabase.from('notifications').insert({
          user_id: order.user_id,
          type: 'payment',
          title: '↩️ 결제 취소',
          message: `₩${cancelAmount?.toLocaleString()} 결제가 취소되었습니다.`,
          metadata: { order_id: order.id, paymentId },
        });

        console.log('[Webhook V2] Payment cancelled:', order.id);
        break;
      }

      case 'FAILED': {
        await supabase
          .from('payment_orders')
          .update({ status: 'failed', pg_transaction_id: paymentId })
          .eq('id', order.id);

        console.log('[Webhook V2] Payment failed:', order.id);
        break;
      }

      default:
        console.log('[Webhook V2] Unhandled status:', pgStatus);
    }

    return new Response(
      JSON.stringify({ received: true, status: pgStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook V2] Error:', error);
    return new Response(
      JSON.stringify({ received: true, error: 'Internal processing error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
