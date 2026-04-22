import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VNChargeRequest {
  impUid: string;
  merchantUid: string;
  krwAmount: number;
  vnAmount: number;
  bonusVN: number;
}

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

    const body: VNChargeRequest = await req.json();
    const { impUid, merchantUid, krwAmount, vnAmount, bonusVN } = body;

    const totalVN = vnAmount + bonusVN;

    // 현재 잔액 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('vn_balance')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return new Response(
        JSON.stringify({ error: '프로필을 찾을 수 없습니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = profile.vn_balance || 0;
    const newBalance = currentBalance + totalVN;

    // VN 충전 기록 생성
    const { data: chargeRecord, error: chargeError } = await supabase
      .from('vn_charge_records')
      .insert({
        user_id: user.id,
        krw_amount: krwAmount,
        vn_amount: vnAmount,
        bonus_vn: bonusVN,
        total_vn: totalVN,
        exchange_rate: 1, // 1 KRW = 1 VN
      })
      .select()
      .single();

    if (chargeError) {
      console.error('Charge record error:', chargeError);
      return new Response(
        JSON.stringify({ error: '충전 기록 생성에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 잔액 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ vn_balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      console.error('Balance update error:', updateError);
      return new Response(
        JSON.stringify({ error: '잔액 업데이트에 실패했습니다' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 거래 내역 기록
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'charge',
      amount: totalVN,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `VN 토큰 충전 (${vnAmount.toLocaleString()} + 보너스 ${bonusVN.toLocaleString()})`,
      reference_type: 'vn_charge',
      reference_id: chargeRecord.id,
      status: 'completed',
    });

    // 알림 생성
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'charge',
      title: '💰 VN 토큰 충전 완료',
      message: `${totalVN.toLocaleString()} VN이 충전되었습니다. ${bonusVN > 0 ? `(보너스 ${bonusVN.toLocaleString()} VN 포함)` : ''}`,
      metadata: {
        chargeId: chargeRecord.id,
        krwAmount,
        vnAmount,
        bonusVN,
        totalVN,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        chargeId: chargeRecord.id,
        totalVN,
        newBalance,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process VN charge error:', error);
    return new Response(
      JSON.stringify({ error: '충전 처리 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
