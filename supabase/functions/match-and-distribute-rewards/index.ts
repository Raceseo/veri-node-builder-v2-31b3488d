import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 기업 결제 완료 후 자동으로:
 * 1. 조건에 맞는 공급자 매칭
 * 2. 보상 분배
 * 3. 알림 발송
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { purchaseId } = await req.json();

    if (!purchaseId) {
      return new Response(
        JSON.stringify({ error: 'purchaseId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. 구매 정보 조회
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
        JSON.stringify({ error: 'Purchase must be paid before matching' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. 구매 조건 파싱
    const priceBreakdown = purchase.price_breakdown as any || {};
    const targetCategories = priceBreakdown.categories || [];
    const targetGrade = purchase.target_grade || 'silver';
    const targetCount = purchase.unit_count || 100;

    // 등급별 최소 trust_score
    const gradeMinScores: Record<string, number> = {
      'platinum': 85,
      'gold': 70,
      'silver': 50,
    };
    const minTrustScore = gradeMinScores[targetGrade] || 50;

    // 3. 조건에 맞는 공급자 매칭
    // - 인증된 사용자
    // - 등급 조건 충족
    // - 해당 카테고리 데이터 보유
    // - 데이터 판매 활성화 (data_listings가 active)
    let query = supabase
      .from('profiles')
      .select(`
        id,
        trust_score,
        is_verified,
        profile_completeness,
        data_categories,
        data_last_updated
      `)
      .eq('is_verified', true)
      .gte('trust_score', minTrustScore)
      .not('data_categories', 'is', null);

    const { data: eligibleSuppliers, error: supplierError } = await query;

    if (supplierError) {
      console.error('Supplier query error:', supplierError);
      return new Response(
        JSON.stringify({ error: 'Failed to query suppliers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 카테고리 필터링 및 점수 기반 정렬
    let matchedSuppliers = (eligibleSuppliers || [])
      .filter(supplier => {
        if (targetCategories.length === 0) return true;
        const userCategories = supplier.data_categories || [];
        return targetCategories.some((cat: string) => userCategories.includes(cat));
      })
      .sort((a, b) => {
        // trust_score + profile_completeness로 우선순위 결정
        const scoreA = (a.trust_score || 0) + (a.profile_completeness || 0) * 0.5;
        const scoreB = (b.trust_score || 0) + (b.profile_completeness || 0) * 0.5;
        return scoreB - scoreA;
      })
      .slice(0, targetCount); // 목표 수만큼 선택

    if (matchedSuppliers.length === 0) {
      // 매칭된 공급자가 없으면 수집 대기 상태로 변경
      await supabase
        .from('data_purchases')
        .update({ 
          status: 'collecting',
        })
        .eq('id', purchaseId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'collecting',
          message: '조건에 맞는 공급자를 수집 중입니다.',
          matched: 0,
          target: targetCount,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. 보상 분배 계산
    const supplierPool = purchase.supplier_pool;
    const totalSuppliers = matchedSuppliers.length;

    // 기본 보상 (공급자 풀의 80%를 균등 분배)
    const basePool = supplierPool * 0.8;
    const bonusPool = supplierPool * 0.2;
    const baseAmount = Math.round(basePool / totalSuppliers);

    const payouts: any[] = [];
    const notifications: any[] = [];

    for (const supplier of matchedSuppliers) {
      // 품질 보너스 계산
      let verificationBonus = 0;
      let completenessBonus = 0;
      let freshnessBonus = 0;

      // 인증 보너스 (최대 40% of bonus pool per person)
      if (supplier.is_verified) {
        verificationBonus = Math.round((bonusPool / totalSuppliers) * 0.4);
      }

      // 완성도 보너스 (최대 30% of bonus pool per person)
      const completeness = supplier.profile_completeness || 0;
      completenessBonus = Math.round((bonusPool / totalSuppliers) * 0.3 * (completeness / 100));

      // 신선도 보너스 (7일 이내 데이터, 최대 30% of bonus pool per person)
      if (supplier.data_last_updated) {
        const hoursSinceUpdate = (Date.now() - new Date(supplier.data_last_updated).getTime()) / (1000 * 60 * 60);
        const daysSinceUpdate = hoursSinceUpdate / 24;
        if (daysSinceUpdate <= 7) {
          const freshnessMultiplier = 1 - (daysSinceUpdate / 7) * 0.5;
          freshnessBonus = Math.round((bonusPool / totalSuppliers) * 0.3 * freshnessMultiplier);
        }
      }

      const qualityBonus = verificationBonus + completenessBonus + freshnessBonus;
      const totalAmount = baseAmount + qualityBonus;

      // 등급 결정
      let verificationGrade = 'silver';
      if (supplier.is_verified && (supplier.profile_completeness || 0) >= 80) {
        verificationGrade = 'platinum';
      } else if (supplier.is_verified) {
        verificationGrade = 'gold';
      }

      payouts.push({
        purchase_id: purchaseId,
        supplier_id: supplier.id,
        base_amount: baseAmount,
        quality_bonus: qualityBonus,
        total_amount: totalAmount,
        trust_score_at_time: supplier.trust_score || 65,
        verification_grade: verificationGrade,
        bonus_breakdown: {
          verification: verificationBonus,
          completeness: completenessBonus,
          freshness: freshnessBonus,
        },
        payout_status: 'paid',
        paid_at: new Date().toISOString(),
      });

      // 알림 데이터
      notifications.push({
        user_id: supplier.id,
        type: 'revenue',
        title: '💰 데이터 판매 수익 발생!',
        message: `데이터 제공 보상으로 ${totalAmount.toLocaleString()} VN을 받았습니다.`,
        metadata: {
          purchase_id: purchaseId,
          amount: totalAmount,
          base_amount: baseAmount,
          bonus: qualityBonus,
        },
      });
    }

    // 5. 지급 기록 일괄 삽입
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

    // 6. 각 공급자 잔액 업데이트 및 거래 내역 기록
    for (const payout of payouts) {
      // 현재 잔액 조회
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('vn_balance')
        .eq('id', payout.supplier_id)
        .single();

      const currentBalance = currentProfile?.vn_balance || 0;
      const newBalance = currentBalance + payout.total_amount;

      // 잔액 업데이트
      await supabase
        .from('profiles')
        .update({ 
          vn_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payout.supplier_id);

      // 거래 내역 기록
      await supabase
        .from('transactions')
        .insert({
          user_id: payout.supplier_id,
          type: 'data_sale',
          amount: payout.total_amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: `데이터 판매 수익 (기본: ${payout.base_amount} VN + 보너스: ${payout.quality_bonus} VN)`,
          reference_type: 'data_purchase',
          reference_id: purchaseId,
          status: 'completed',
        });
    }

    // 7. 알림 일괄 발송
    await supabase
      .from('notifications')
      .insert(notifications);

    // 8. 구매 상태 업데이트
    const isFullyMatched = matchedSuppliers.length >= targetCount;
    await supabase
      .from('data_purchases')
      .update({ 
        status: isFullyMatched ? 'completed' : 'partial',
        completed_at: isFullyMatched ? new Date().toISOString() : null,
      })
      .eq('id', purchaseId);

    // 9. 구매자에게 알림
    await supabase
      .from('notifications')
      .insert({
        user_id: purchase.buyer_id,
        type: 'purchase',
        title: isFullyMatched ? '✅ 데이터 수집 완료!' : '📊 데이터 수집 진행 중',
        message: isFullyMatched 
          ? `${matchedSuppliers.length}명의 응답자 데이터가 준비되었습니다.`
          : `${matchedSuppliers.length}/${targetCount}명 수집 완료. 나머지는 계속 수집 중입니다.`,
        metadata: {
          purchase_id: purchaseId,
          matched: matchedSuppliers.length,
          target: targetCount,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        status: isFullyMatched ? 'completed' : 'partial',
        distributed: {
          purchaseId,
          matched: matchedSuppliers.length,
          target: targetCount,
          supplierPool,
          avgReward: Math.round(supplierPool / matchedSuppliers.length),
        },
        message: `${matchedSuppliers.length}명의 공급자에게 보상이 분배되었습니다.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Match and distribute error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
