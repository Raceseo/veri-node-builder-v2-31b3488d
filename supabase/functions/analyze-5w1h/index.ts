import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * 5W1H 분석 알고리즘
 * Who: 누가 (사용자 인구통계)
 * What: 무엇을 (데이터 카테고리)
 * When: 언제 (시간 패턴)
 * Where: 어디서 (지역/위치)
 * Why: 왜 (동기/목적)
 * How: 어떻게 (행동 패턴)
 */

interface AnalysisInput {
  userId: string;
  dataType: string;
  content: Record<string, unknown>;
}

interface AnalysisResult {
  who: { score: number; factors: string[] };
  what: { score: number; factors: string[] };
  when: { score: number; factors: string[] };
  where: { score: number; factors: string[] };
  why: { score: number; factors: string[] };
  how: { score: number; factors: string[] };
  totalScore: number;
  trustScoreChange: number;
  vnReward: number;
}

function analyze5W1H(profile: Record<string, unknown>, content: Record<string, unknown>): AnalysisResult {
  const result: AnalysisResult = {
    who: { score: 0, factors: [] },
    what: { score: 0, factors: [] },
    when: { score: 0, factors: [] },
    where: { score: 0, factors: [] },
    why: { score: 0, factors: [] },
    how: { score: 0, factors: [] },
    totalScore: 0,
    trustScoreChange: 0,
    vnReward: 0,
  };

  // WHO 분석: 사용자 인구통계 완성도
  const whoFactors = ['age_group', 'gender', 'occupation', 'industry', 'company'];
  whoFactors.forEach(factor => {
    if (profile[factor]) {
      result.who.score += 20;
      result.who.factors.push(factor);
    }
  });

  // WHAT 분석: 제공 데이터 다양성
  const dataCategories = profile.data_categories as string[] || [];
  result.what.score = Math.min(100, dataCategories.length * 15);
  result.what.factors = dataCategories;

  // WHEN 분석: 데이터 신선도
  const lastUpdated = profile.data_last_updated as string;
  if (lastUpdated) {
    const hoursSinceUpdate = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate < 24) result.when.score = 100;
    else if (hoursSinceUpdate < 72) result.when.score = 80;
    else if (hoursSinceUpdate < 168) result.when.score = 60;
    else result.when.score = 40;
    result.when.factors.push(`${Math.round(hoursSinceUpdate)}시간 전 업데이트`);
  }

  // WHERE 분석: 지역 정보
  if (profile.region) {
    result.where.score = 80;
    result.where.factors.push(profile.region as string);
  }

  // WHY 분석: 사용자 관심사/동기
  const interests = profile.interests as string[] || [];
  result.why.score = Math.min(100, interests.length * 20);
  result.why.factors = interests;

  // HOW 분석: 인증 수준 및 활동 패턴
  if (profile.is_verified) {
    result.how.score += 50;
    result.how.factors.push('본인인증 완료');
  }
  if ((profile.profile_completeness as number) >= 80) {
    result.how.score += 30;
    result.how.factors.push('프로필 완성도 높음');
  }
  if ((profile.security_level as number) >= 2) {
    result.how.score += 20;
    result.how.factors.push('보안 수준 우수');
  }

  // 콘텐츠 분석 보너스
  if (content && Object.keys(content).length > 0) {
    const contentKeys = Object.keys(content);
    if (contentKeys.length >= 3) {
      result.what.score = Math.min(100, result.what.score + 20);
    }
  }

  // 종합 점수 계산 (가중치 적용)
  const weights = { who: 0.2, what: 0.25, when: 0.15, where: 0.1, why: 0.15, how: 0.15 };
  result.totalScore = Math.round(
    result.who.score * weights.who +
    result.what.score * weights.what +
    result.when.score * weights.when +
    result.where.score * weights.where +
    result.why.score * weights.why +
    result.how.score * weights.how
  );

  // 신뢰점수 변화량 및 VN 보상 계산
  if (result.totalScore >= 80) {
    result.trustScoreChange = 3;
    result.vnReward = 150;
  } else if (result.totalScore >= 60) {
    result.trustScoreChange = 2;
    result.vnReward = 100;
  } else if (result.totalScore >= 40) {
    result.trustScoreChange = 1;
    result.vnReward = 50;
  } else {
    result.trustScoreChange = 0;
    result.vnReward = 10;
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, dataType, content } = await req.json() as AnalysisInput;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5W1H 분석 실행
    const analysisResult = analyze5W1H(profile, content || {});

    // 신뢰점수 업데이트
    const currentTrustScore = profile.trust_score || 0;
    const newTrustScore = Math.min(1000, currentTrustScore + analysisResult.trustScoreChange);
    const newVnBalance = (profile.vn_balance || 0) + analysisResult.vnReward;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        trust_score: newTrustScore,
        vn_balance: newVnBalance,
        data_last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 인증 이력 기록
    await supabase.from("verification_history").insert({
      user_id: userId,
      verification_type: `5w1h_analysis_${dataType || 'general'}`,
      score_change: analysisResult.trustScoreChange,
      trust_score_before: currentTrustScore,
      trust_score_after: newTrustScore,
      vn_earned: analysisResult.vnReward,
      result: analysisResult,
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        newTrustScore,
        newVnBalance,
        message: `5W1H 분석 완료! 신뢰점수 +${analysisResult.trustScoreChange}, VN +${analysisResult.vnReward}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("5W1H Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
