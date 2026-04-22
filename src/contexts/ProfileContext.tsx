import React, { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeProfile, RealtimeProfileData } from "@/hooks/useRealtimeProfile";

interface ProfileContextValue {
  profile: RealtimeProfileData | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isRealtimeConnected: boolean;
  analyze5W1H: (dataType: string, content: Record<string, unknown>) => Promise<unknown>;
  
  // 편의 속성 (자주 사용되는 값들)
  trustScore: number;
  vnBalance: number;
  lockedBalance: number;
  displayName: string;
  isVerified: boolean;
  securityLevel: number;
  profileCompleteness: number;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

/**
 * ProfileProvider - 전역 프로필 상태 관리
 * 
 * 앱 전체에서 프로필 데이터를 한 번만 조회하고 공유합니다.
 * Supabase Realtime을 통해 실시간 업데이트를 지원합니다.
 * 
 * 사용법:
 * ```tsx
 * const { profile, trustScore, vnBalance, isLoading } = useProfileContext();
 * ```
 */
export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const { user } = useAuth();
  
  const {
    profile,
    isLoading,
    error,
    refetch,
    isRealtimeConnected,
    analyze5W1H,
  } = useRealtimeProfile(user?.id);

  // 편의 속성 계산 (기본값 포함)
  const trustScore = profile?.trust_score ?? 0;
  const vnBalance = profile?.vn_balance ?? 0;
  const lockedBalance = profile?.locked_balance ?? 0;
  const displayName = profile?.display_name || user?.email?.split('@')[0] || "사용자";
  const isVerified = profile?.is_verified ?? false;
  const securityLevel = profile?.security_level ?? 0;
  const profileCompleteness = profile?.profile_completeness ?? 0;

  const value: ProfileContextValue = {
    profile,
    isLoading,
    error,
    refetch,
    isRealtimeConnected,
    analyze5W1H,
    
    // 편의 속성
    trustScore,
    vnBalance,
    lockedBalance,
    displayName,
    isVerified,
    securityLevel,
    profileCompleteness,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

/**
 * useProfileContext - 전역 프로필 데이터 접근 훅
 * 
 * ProfileProvider 내부에서만 사용 가능합니다.
 * 
 * @example
 * ```tsx
 * const { trustScore, vnBalance, displayName, isLoading } = useProfileContext();
 * 
 * if (isLoading) return <Skeleton />;
 * return <div>잔액: {vnBalance} VN</div>;
 * ```
 */
export const useProfileContext = (): ProfileContextValue => {
  const context = useContext(ProfileContext);
  
  if (context === undefined) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  
  return context;
};

export default ProfileContext;
