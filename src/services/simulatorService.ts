import { supabase } from '@/integrations/supabase/client';

interface TargetCriteria {
  ageRange: [number, number];
  region: string[];
  interests: string[];
  requiredSampleCount: number;
}

interface UserProfile {
  id: string;
  age: number;
  region: string;
  tags: string[];
  trustScore: number;
}

export const simulatorService = {
  /**
   * 미션 2: 수요자용 타겟 필터링
   * 데이터 수요자가 원하는 조건에 맞는 유저 필터링
   */
  filterTargets: async (criteria: TargetCriteria): Promise<UserProfile[]> => {
    // 1. 기본 쿼리 구성
    let query = supabase
      .from('profiles')
      .select('id, age, region, tags, trust_score')
      .gte('age', criteria.ageRange[0])
      .lte('age', criteria.ageRange[1]);

    if (criteria.region.length > 0) {
      query = query.in('region', criteria.region);
    }

    const { data, error } = await query;
    if (error) throw error;

    // 2. 인메모리 정밀 필터링 (Tags & Interests)
    const candidates = (data as any[]).filter(user => 
      criteria.interests.some(interest => user.tags?.includes(interest))
    );

    return candidates;
  },

  /**
   * 미션 2: 표본 수 감쇄 알고리즘 (Decay Algorithm)
   * 목표 표본 수를 초과할 경우, 신뢰도(TrustScore) 기반으로 최적의 표본만 남기고 감쇄시킴
   */
  applySampleDecay: (candidates: UserProfile[], targetCount: number): UserProfile[] => {
    if (candidates.length <= targetCount) return candidates;

    // 신뢰도 점수 내림차순 정렬
    const sortedCandidates = [...candidates].sort((a, b) => b.trustScore - a.trustScore);

    // 감쇄 계수 적용: 단순히 자르는 것이 아니라, 상위 그룹에서 다양성을 유지하며 샘플링 (여기서는 단순화하여 Top-N 추출)
    // 실제 알고리즘: Score * (1 / (1 + DecayFactor * Rank))
    
    const optimizedSample = sortedCandidates.slice(0, targetCount);
    
    console.log(`[Simulator] Decay Applied: ${candidates.length} -> ${optimizedSample.length} (Target: ${targetCount})`);
    
    return optimizedSample;
  },

  /**
   * 시뮬레이션 실행
   */
  runSimulation: async (criteria: TargetCriteria) => {
    const candidates = await simulatorService.filterTargets(criteria);
    const finalSample = simulatorService.applySampleDecay(candidates, criteria.requiredSampleCount);
    
    return {
      matchedCount: candidates.length,
      finalSampleCount: finalSample.length,
      estimatedCost: finalSample.length * 150 // 1인당 단가 예시
    };
  }
};