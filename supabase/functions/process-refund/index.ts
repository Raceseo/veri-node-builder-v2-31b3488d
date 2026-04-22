import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefundRequest {
  orderId: string;
  amount?: number; // 부분 환불 시 금액, 미입력 시 전액 환불
  reason: string;
  reasonCategory?: string;
}

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

    const body: RefundRequest = await req.json();
    const { orderId, amount, reason, reasonCategory } = body;

    if (!orderId || !reason) {
      return new Response(
        JSON.stringify({ error: '주문 ID와 환불 사유는 필수입니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 원결제 정보 조회
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: '결제 정보를 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (order.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: '완료된 결제만 환불 가능합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const refundAmount = amount || order.total_amount;
    
    if (refundAmount > order.total_amount) {
      return new Response(
        JSON.stringify({ error: '환불 금액이 결제 금액을 초과합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      // In production, PortOne keys are required for refunds
      console.error('CRITICAL: PortOne API keys not configured in production');
      return new Response(
        JSON.stringify({ error: '결제 게이트웨이가 설정되지 않았습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PortOne 환불 API 호출
    let portoneRefundSuccess = false;
    const impUid = order.metadata?.impUid;

    if (portoneAccessToken && impUid) {
      try {
        const refundResponse = await fetch('https://api.iamport.kr/payments/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${portoneAccessToken}`,
          },
          body: JSON.stringify({
            imp_uid: impUid,
            amount: refundAmount,
            reason: reason,
          }),
        });
        const refundData = await refundResponse.json();
        portoneRefundSuccess = refundData.code === 0;
        
        if (!portoneRefundSuccess) {
          console.error('PortOne refund failed:', refundData);
        }
      } catch (e) {
        console.error('PortOne refund error:', e);
      }
    }

    // 환불 기록 생성
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        user_id: user.id,
        payment_order_id: orderId,
        refund_amount: refundAmount,
        reason: reason,
        reason_category: reasonCategory || 'customer_request',
        status: portoneRefundSuccess ? 'completed' : 'pending',
        processed_at: portoneRefundSuccess ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (refundError) {
      console.error('Refund record error:', refundError);
      return new Response(
        JSON.stringify({ error: '환불 기록 생성에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 결제 주문 상태 업데이트
    const newStatus = refundAmount === order.total_amount ? 'refunded' : 'partially_refunded';
    await supabase
      .from('payment_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    // VN 충전 환불인 경우 토큰 차감
    if (order.order_type === 'vn_charge' && portoneRefundSuccess) {
      const vnAmount = Math.floor(refundAmount); // 보너스 제외 기본 금액만 차감
      await supabase
        .from('profiles')
        .update({ 
          vn_balance: supabase.rpc('decrement_balance', { amount: vnAmount }),
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);
    }

    // 알림 발송
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'payment',
        title: '환불 처리 ' + (portoneRefundSuccess ? '완료' : '접수'),
        message: portoneRefundSuccess 
          ? `${refundAmount.toLocaleString()}원이 환불되었습니다.`
          : `환불 요청이 접수되었습니다. 검토 후 처리됩니다.`,
        metadata: { refund_id: refund.id, amount: refundAmount },
      });

    console.log('Refund processed:', { refundId: refund.id, amount: refundAmount, success: portoneRefundSuccess });

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        status: refund.status,
        message: portoneRefundSuccess 
          ? '환불이 완료되었습니다.' 
          : '환불 요청이 접수되었습니다.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process refund error:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
