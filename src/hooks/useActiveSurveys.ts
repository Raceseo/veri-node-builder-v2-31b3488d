import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * 구간② — 공급자가 참여 가능한 active 설문 목록.
 * - surveys(status='active') + 문항 수 + "이미 보상받았는지"(survey_reward_claims) 를 합쳐 반환.
 * - is_trap 미노출 규칙: survey_questions 는 survey_id 컬럼만 select(허용 컬럼).
 * - types.ts(생성본)에 surveys/survey_questions/survey_reward_claims 가 아직 없어 클라이언트를 캐스팅해 사용.
 */
export interface ActiveSurveyItem {
  id: string;
  title: string;
  description: string | null;
  reward_vn: number;
  questionCount: number;
  claimed: boolean; // 이 사용자가 이미 보상을 받은 설문인가
}

export function useActiveSurveys(userId: string | undefined) {
  return useQuery({
    queryKey: ["active-surveys", userId],
    queryFn: async (): Promise<ActiveSurveyItem[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      // 1) active 설문
      const { data: surveys, error: sErr } = await sb
        .from("surveys")
        .select("id, title, description, reward_vn, status, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (sErr) throw sErr;

      const list = (surveys ?? []) as Array<{
        id: string;
        title: string;
        description: string | null;
        reward_vn: number | null;
      }>;
      if (list.length === 0) return [];

      const ids = list.map((s) => s.id);

      // 2) 문항 수 (survey_id 만 조회 — is_trap 등 비노출 컬럼 회피)
      const { data: qs } = await sb
        .from("survey_questions")
        .select("survey_id")
        .in("survey_id", ids);
      const countBySurvey: Record<string, number> = {};
      (qs ?? []).forEach((q: { survey_id: string }) => {
        countBySurvey[q.survey_id] = (countBySurvey[q.survey_id] ?? 0) + 1;
      });

      // 3) 이미 보상받은 설문 (권한/테이블 문제로 실패하면 빈 집합 → 서버가 already_claimed 로 최종 차단)
      let claimedSet = new Set<string>();
      if (userId) {
        const { data: claims } = await sb
          .from("survey_reward_claims")
          .select("survey_id")
          .eq("user_id", userId);
        claimedSet = new Set((claims ?? []).map((c: { survey_id: string }) => c.survey_id));
      }

      return list.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description ?? null,
        reward_vn: s.reward_vn ?? 0,
        questionCount: countBySurvey[s.id] ?? 0,
        claimed: claimedSet.has(s.id),
      }));
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}
