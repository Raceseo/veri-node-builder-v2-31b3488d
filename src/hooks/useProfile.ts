import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileData {
  id: string;
  email: string | null;
  display_name: string | null;
  trust_score: number;
  vn_balance: number;
  locked_balance: number;
  security_level: number;
  is_verified: boolean;
  occupation: string | null;
  company: string | null;
  sns_keywords: string[] | null;
  introduction: string | null;
  data_categories: string[] | null;
  age_group: string | null;
  gender: string | null;
  region: string | null;
  industry: string | null;
  interests: string[] | null;
  profile_completeness: number;
  onboarding_completed: boolean;
  data_last_updated: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<ProfileData | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          display_name,
          trust_score,
          vn_balance,
          locked_balance,
          security_level,
          is_verified,
          occupation,
          company,
          sns_keywords,
          introduction,
          data_categories,
          age_group,
          gender,
          region,
          industry,
          interests,
          profile_completeness,
          onboarding_completed,
          data_last_updated,
          created_at,
          updated_at
        `)
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      
      // 프로필이 없는 경우 null 반환
      if (!data) return null;
      
      // 핵심 로직: 미인증 사용자라면 점수를 0으로 강제 리턴
      if (!data.is_verified) {
        return { 
          ...data, 
          trust_score: 0,
          security_level: 0
        } as ProfileData;
      }
      return data as ProfileData;
    },
    enabled: !!userId,
  });
};
