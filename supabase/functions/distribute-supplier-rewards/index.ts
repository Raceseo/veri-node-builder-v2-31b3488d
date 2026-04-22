import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DistributeRequest {
  purchaseId: string;
  supplierIds: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { purchaseId, supplierIds }: DistributeRequest = await req.json();

    if (!purchaseId || !supplierIds || supplierIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'purchaseId and supplierIds are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 구매 정보 조회
    const { data: purchase, error: purchaseError } = await supabase
      .from('data_purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (purchaseError || !purchase) {
      return new Response(
        JSON.stringify({ error: 'Purchase not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (purchase.status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Purchase must be paid before distributing rewards' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supplierPool = purchase.supplier_pool;
    const totalSuppliers = supplierIds.length;

    // 기본 보상 (공급자 풀의 80%를 균등 분배)
    const basePool = supplierPool * 0.8;
    const bonusPool = supplierPool * 0.2;
    const baseAmount = Math.round(basePool / totalSuppliers);

    // 공급자별 프로필 조회
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, trust_score, is_verified, profile_completeness, data_last_updated')
      .in('id', supplierIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const payouts: any[] = [];
    const transactions: any[] = [];

    for (const supplierId of supplierIds) {
      const profile = profileMap.get(supplierId);
      
      // 품질 보너스 계산
      let verificationBonus = 0;
      let completenessBonus = 0;
      let freshnessBonus = 0;

      if (profile) {
        // 인증 보너스 (최대 40% of bonus pool per person)
        if (profile.is_verified) {
          verificationBonus = Math.round((bonusPool / totalSuppliers) * 0.4);
        }

        // 완성도 보너스 (최대 30% of bonus pool per person)
        const completeness = profile.profile_completeness || 0;
        completenessBonus = Math.round((bonusPool / totalSuppliers) * 0.3 * (completeness / 100));

        // 신선도 보너스 (7일 이내 데이터, 최대 30% of bonus pool per person)
        if (profile.data_last_updated) {
          const hoursSinceUpdate = (Date.now() - new Date(profile.data_last_updated).getTime()) / (1000 * 60 * 60);
          const daysSinceUpdate = hoursSinceUpdate / 24;
          if (daysSinceUpdate <= 7) {
            const freshnessMultiplier = 1 - (daysSinceUpdate / 7) * 0.5;
            freshnessBonus = Math.round((bonusPool / totalSuppliers) * 0.3 * freshnessMultiplier);
          }
        }
      }

      const totalAmount = baseAmount + verificationBonus + completenessBonus + freshnessBonus;

      // 등급 결정
      let verificationGrade = 'silver';
      if (profile?.is_verified && (profile?.profile_completeness || 0) >= 80) {
        verificationGrade = 'platinum';
      } else if (profile?.is_verified) {
        verificationGrade = 'gold';
      }

      payouts.push({
        purchase_id: purchaseId,
        supplier_id: supplierId,
        base_amount: baseAmount,
        quality_bonus: verificationBonus + completenessBonus + freshnessBonus,
        total_amount: totalAmount,
        trust_score_at_time: profile?.trust_score || 65,
        verification_grade: verificationGrade,
        bonus_breakdown: {
          verification: verificationBonus,
          completeness: completenessBonus,
          freshness: freshnessBonus,
        },
        payout_status: 'paid',
        paid_at: new Date().toISOString(),
      });

      // 잔액 업데이트용 트랜잭션 데이터
      transactions.push({
        supplierId,
        amount: totalAmount,
      });
    }

    // 지급 기록 일괄 삽입
    const { error: payoutError } = await supabase
      .from('supplier_payouts')
      .insert(payouts);

    if (payoutError) {
      console.error('Payout insert error:', payoutError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payout records' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 각 공급자 잔액 업데이트 및 거래 내역 기록
    for (const tx of transactions) {
      // 현재 잔액 조회
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('vn_balance')
        .eq('id', tx.supplierId)
        .single();

      const currentBalance = currentProfile?.vn_balance || 0;
      const newBalance = currentBalance + tx.amount;

      // 잔액 업데이트
      await supabase
        .from('profiles')
        .update({ 
          vn_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tx.supplierId);

      // 거래 내역 기록
      await supabase
        .from('transactions')
        .insert({
          user_id: tx.supplierId,
          type: 'survey_reward',
          amount: tx.amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `설문 참여 보상 (구매 ID: ${purchaseId})`,
          reference_type: 'data_purchase',
          reference_id: purchaseId,
        });
    }

    // 구매 상태 완료로 업데이트
    await supabase
      .from('data_purchases')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', purchaseId);

    return new Response(
      JSON.stringify({
        success: true,
        distributed: {
          purchaseId,
          totalSuppliers,
          supplierPool,
          averageReward: Math.round(supplierPool / totalSuppliers),
        },
        message: `${totalSuppliers}명의 공급자에게 보상이 분배되었습니다.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Distribute supplier rewards error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
