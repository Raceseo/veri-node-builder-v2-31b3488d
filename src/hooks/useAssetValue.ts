import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  calculateAssetValue, 
  type AssetValueBreakdown 
} from "@/utils/assetValueCalculator";

interface UseAssetValueOptions {
  // 실시간 업데이트 주기 (ms), 0이면 비활성화
  refreshInterval?: number;
  // 계산 결과 변경 콜백
  onValueChange?: (breakdown: AssetValueBreakdown) => void;
}

export function useAssetValue(options: UseAssetValueOptions = {}) {
  const { refreshInterval = 30000, onValueChange } = options;
  const { user } = useAuth();
  const [previousValue, setPreviousValue] = useState<number | undefined>();
  
  // 프로필 조회
  const { 
    data: profile, 
    isLoading: profileLoading,
    refetch: refetchProfile 
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 10000,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
  });
  
  // 카테고리 가치 데이터 조회
  const { 
    data: categoryValues, 
    isLoading: categoryLoading,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['data-category-values'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_category_values')
        .select('*');
      if (error) throw error;
      return data;
    },
    staleTime: 60000, // 1분간 캐시
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
  });
  
  // 자산 가치 계산
  const assetBreakdown = useMemo(() => {
    if (!profile) return null;
    
    return calculateAssetValue(
      { 
        profile,
        categoryValues: categoryValues || []
      },
      previousValue
    );
  }, [profile, categoryValues, previousValue]);
  
  // 가치 변경 시 콜백 호출 및 이전 값 저장
  useEffect(() => {
    if (assetBreakdown) {
      onValueChange?.(assetBreakdown);
      
      // 이전 값 저장 (다음 계산에 사용)
      if (assetBreakdown.totalValue !== previousValue) {
        setPreviousValue(assetBreakdown.totalValue);
      }
    }
  }, [assetBreakdown, onValueChange]);
  
  // 데이터 갱신 함수
  const refreshData = async () => {
    // 프로필의 data_last_updated 갱신
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ data_last_updated: new Date().toISOString() })
        .eq('id', user.id);
    }
    
    // 데이터 다시 조회
    await Promise.all([refetchProfile(), refetchCategories()]);
  };
  
  return {
    // 로딩 상태
    isLoading: profileLoading || categoryLoading,
    
    // 원본 데이터
    profile,
    categoryValues,
    
    // 계산된 자산 가치
    assetBreakdown,
    
    // 유틸리티
    refreshData,
    refetchProfile,
    refetchCategories,
  };
}

/**
 * 실시간 가치 변동을 시뮬레이션하는 훅 (데모용)
 */
export function useAssetValueSimulation(baseBreakdown: AssetValueBreakdown | null) {
  const [simulatedValue, setSimulatedValue] = useState<number>(0);
  const [valueHistory, setValueHistory] = useState<{ time: string; value: number }[]>([]);
  
  useEffect(() => {
    if (!baseBreakdown) return;
    
    // 초기값 설정
    setSimulatedValue(baseBreakdown.totalValue);
    
    // 시간대별 차트 데이터 생성
    const hours = [];
    const now = new Date();
    for (let i = 10; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000);
      const hourStr = time.getHours().toString().padStart(2, '0') + ':00';
      
      // 시간대별 가치 변동 시뮬레이션
      const variance = (Math.random() - 0.5) * 0.1; // ±5% 변동
      const timeMultiplier = 1 + variance;
      const value = Math.round(baseBreakdown.totalValue * timeMultiplier);
      
      hours.push({ time: hourStr, value });
    }
    hours.push({ time: '현재', value: baseBreakdown.totalValue });
    
    setValueHistory(hours);
  }, [baseBreakdown]);
  
  // 주기적 미세 변동
  useEffect(() => {
    if (!baseBreakdown) return;
    
    const interval = setInterval(() => {
      // ±0.5% 미세 변동
      const variance = (Math.random() - 0.5) * 0.01;
      setSimulatedValue(prev => Math.round(prev * (1 + variance)));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [baseBreakdown]);
  
  return {
    simulatedValue,
    valueHistory,
  };
}
