import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RealtimeProfileData {
  id: string;
  trust_score: number | null;
  vn_balance: number | null;
  locked_balance: number;
  security_level: number;
  is_verified: boolean | null;
  profile_completeness: number | null;
  data_last_updated: string | null;
  data_categories: string[] | null;
  display_name: string | null;
  age_group: string | null;
  gender: string | null;
  region: string | null;
  occupation: string | null;
  industry: string | null;
  interests: string[] | null;
  // 추가 필드
  company: string | null;
  onboarding_completed: boolean | null;
  email: string | null;
  introduction: string | null;
  sns_keywords: string[] | null;
  user_type: string | null;
}

export const useRealtimeProfile = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // 프로필 데이터 쿼리 - 통합된 쿼리 키 사용
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ["profile", userId], // 통합 쿼리 키: 모든 컴포넌트에서 동일하게 사용
    queryFn: async (): Promise<RealtimeProfileData | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          trust_score,
          vn_balance,
          locked_balance,
          security_level,
          is_verified,
          profile_completeness,
          data_last_updated,
          data_categories,
          display_name,
          age_group,
          gender,
          region,
          occupation,
          industry,
          interests,
          company,
          onboarding_completed,
          email,
          introduction,
          sns_keywords,
          user_type
        `)
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // 미인증 사용자는 점수 0 강제
      if (!data.is_verified) {
        return {
          ...data,
          trust_score: 0,
          security_level: 0,
        } as RealtimeProfileData;
      }

      return data as RealtimeProfileData;
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30초
  });

  // Realtime 구독 설정
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile-changes-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log("Profile updated in realtime:", payload);
          
          // 쿼리 캐시 무효화 및 리페치 - 통합된 쿼리 키 사용
          queryClient.invalidateQueries({ queryKey: ["profile", userId] });
          
          // 잔액 변경 알림
          const newData = payload.new as RealtimeProfileData;
          const oldData = payload.old as RealtimeProfileData;
          
          if (newData.vn_balance !== oldData.vn_balance) {
            const diff = (newData.vn_balance || 0) - (oldData.vn_balance || 0);
            if (diff > 0) {
              toast.success(`💰 +${diff} VN 적립!`, {
                description: "데이터 보상이 지급되었습니다.",
              });
            }
          }
          
          if (newData.trust_score !== oldData.trust_score) {
            const diff = (newData.trust_score || 0) - (oldData.trust_score || 0);
            if (diff > 0) {
              toast.success(`📈 신뢰점수 +${diff}`, {
                description: `현재 점수: ${newData.trust_score}`,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === "SUBSCRIBED");
        console.log("Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
      setIsRealtimeConnected(false);
    };
  }, [userId, queryClient]);

  // 5W1H 분석 요청 함수
  const analyze5W1H = useCallback(async (
    dataType: string,
    content: Record<string, unknown>
  ) => {
    if (!userId) {
      toast.error("로그인이 필요합니다");
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke("analyze-5w1h", {
        body: { userId, dataType, content },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        refetch(); // 프로필 리페치
        return data;
      }

      return null;
    } catch (err) {
      console.error("5W1H Analysis error:", err);
      toast.error("분석 중 오류가 발생했습니다");
      return null;
    }
  }, [userId, refetch]);

  return {
    profile,
    isLoading,
    error,
    refetch,
    isRealtimeConnected,
    analyze5W1H,
  };
};
