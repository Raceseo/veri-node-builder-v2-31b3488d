import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * 구간F-2 D-1 — 「오늘 적립한 수익」 실값.
 * transactions 에서 오늘(KST) 적립된 설문 보상(type='survey_reward')의 amount 합산.
 *
 * - 범위: type='survey_reward' 한정(충전 등 다른 입금 제외 — 확정 결정).
 * - "오늘" 경계: KST(Asia/Seoul) 0시. 한국은 DST 가 없어 고정 +9h 로 계산하며,
 *   device 로컬 타임존에 의존하지 않도록 getTime()+UTC 게터만 사용한다.
 * - queryKey 는 ["transactions", ...] 접두사로 둔다 → claimSurveyReward 의
 *   bare ["transactions"] 무효화(접두사 매칭)에 걸려 적립 직후 자동 갱신됨.
 * - RLS: transactions 는 본인 행만 SELECT 가능(auth.uid()=user_id) → 클라이언트 직접 조회.
 */

/** KST 오늘 0시를 UTC 순간(ISO)으로. device 타임존 무관. */
function kstStartOfTodayIso(): string {
  const KST = 9 * 60 * 60 * 1000; // 한국 고정 오프셋(+9h, DST 없음)
  const k = new Date(Date.now() + KST);
  const startMs = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()) - KST;
  return new Date(startMs).toISOString();
}

export function useTodaySurveyEarned(userId: string | undefined) {
  return useQuery({
    queryKey: ["transactions", userId, "today-survey-earned"],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;
      const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userId)
        .eq("type", "survey_reward")
        .gte("created_at", kstStartOfTodayIso());
      if (error) throw error;
      return (data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0);
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}
