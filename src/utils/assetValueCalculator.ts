/**
 * VeriNode 데이터 자산 가치 평가 시스템
 * 
 * 핵심 공식:
 * 자산가치 = Σ(카테고리기본가 × 신선도 × 결합도 × 시장수요 × 품질계수)
 * 
 * 영향 요소:
 * - 프로필 완성도: 0-100%
 * - 데이터 신선도: 최종 업데이트 시점 기준
 * - 인증 등급: Silver/Gold/Platinum
 * - 시장 수요: data_category_values 테이블에서 실시간 조회
 */

import type { Tables } from "@/integrations/supabase/types";

// 데이터 카테고리별 기본 가치
export const DATA_CATEGORY_BASE_VALUES: Record<string, { 
  name: string; 
  baseValue: number; 
  weight: number;
  icon: string;
}> = {
  financial: { name: "금융", baseValue: 45000, weight: 0.35, icon: "💳" },
  healthcare: { name: "건강", baseValue: 38000, weight: 0.25, icon: "🏥" },
  mobility: { name: "이동", baseValue: 22000, weight: 0.20, icon: "🚗" },
  consumer: { name: "소비", baseValue: 28000, weight: 0.20, icon: "🛒" },
};

// 인증 등급별 가치 배율
export const VERIFICATION_GRADE_MULTIPLIERS = {
  none: 0.5,      // 미인증
  silver: 1.0,    // 기본 인증
  gold: 1.35,     // 3+ API 인증
  platinum: 1.8,  // 5+ API 인증
  diamond: 2.2,   // 완전 인증
} as const;

// 프로필 완성도 구간별 배율
export const COMPLETENESS_MULTIPLIERS = [
  { min: 0, max: 30, multiplier: 0.4, label: "시작 단계" },
  { min: 30, max: 50, multiplier: 0.6, label: "기본 정보" },
  { min: 50, max: 70, multiplier: 0.8, label: "상세 정보" },
  { min: 70, max: 90, multiplier: 1.0, label: "고급 정보" },
  { min: 90, max: 100, multiplier: 1.25, label: "프리미엄" },
];

export interface AssetValueInput {
  // 프로필 정보
  profile: {
    is_verified: boolean | null;
    profile_completeness: number | null;
    data_last_updated: string | null;
    trust_score: number | null;
    data_categories?: string[] | null;
  };
  // DB에서 조회한 카테고리별 시장 데이터
  categoryValues?: Tables<"data_category_values">[];
}

export interface AssetValueBreakdown {
  // 총합 가치
  totalValue: number;
  previousValue?: number;
  valueChange: number;
  valueChangePercent: number;
  
  // 예상 월 수익
  estimatedMonthlyPension: number;
  
  // 구성 요소
  factors: {
    freshness: number;          // 신선도 (0-100)
    completeness: number;       // 완성도 (0-100)
    verificationGrade: string;  // 인증 등급
    marketDemand: number;       // 시장 수요 (0-100)
  };
  
  // 배율
  multipliers: {
    freshnessMultiplier: number;
    completenessMultiplier: number;
    verificationMultiplier: number;
    demandMultiplier: number;
  };
  
  // 카테고리별 상세
  categoryBreakdown: {
    category: string;
    name: string;
    baseValue: number;
    adjustedValue: number;
    demandFactor: number;
    contribution: number; // 전체 대비 비중
  }[];
  
  // 신뢰 지수
  confidenceIndex: number;
  
  // 등급 정보
  assetGrade: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  nextGradeThreshold: number;
  progressToNextGrade: number;
}

/**
 * 데이터 신선도 계산 (0-100)
 * 24시간 이내: 100%, 이후 시간당 1% 감소, 최소 30%
 */
export function calculateDataFreshness(lastUpdated: string | null): number {
  if (!lastUpdated) return 30;
  
  const now = new Date();
  const updated = new Date(lastUpdated);
  const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceUpdate <= 24) return 100;
  
  // 시간당 1% 감소, 최소 30%
  const decayedFreshness = 100 - (hoursSinceUpdate - 24) * 1;
  return Math.max(30, Math.round(decayedFreshness));
}

/**
 * 프로필 완성도에 따른 배율 계산
 */
export function getCompletenessMultiplier(completeness: number): { multiplier: number; label: string } {
  for (const tier of COMPLETENESS_MULTIPLIERS) {
    if (completeness >= tier.min && completeness < tier.max) {
      return { multiplier: tier.multiplier, label: tier.label };
    }
  }
  return { multiplier: 1.25, label: "프리미엄" };
}

/**
 * 인증 등급 결정
 */
export function determineVerificationGrade(
  isVerified: boolean | null,
  trustScore: number | null
): keyof typeof VERIFICATION_GRADE_MULTIPLIERS {
  if (!isVerified) return 'none';
  
  const score = trustScore || 0;
  if (score >= 95) return 'diamond';
  if (score >= 85) return 'platinum';
  if (score >= 75) return 'gold';
  return 'silver';
}

/**
 * 자산 등급 결정
 */
function determineAssetGrade(totalValue: number): AssetValueBreakdown['assetGrade'] {
  if (totalValue >= 100000) return 'diamond';
  if (totalValue >= 70000) return 'platinum';
  if (totalValue >= 45000) return 'gold';
  if (totalValue >= 25000) return 'silver';
  return 'bronze';
}

/**
 * 다음 등급까지의 임계값
 */
function getNextGradeThreshold(currentGrade: AssetValueBreakdown['assetGrade']): number {
  const thresholds = {
    bronze: 25000,
    silver: 45000,
    gold: 70000,
    platinum: 100000,
    diamond: 150000,
  };
  return thresholds[currentGrade];
}

/**
 * 평균 시장 수요 계산
 */
function calculateAverageMarketDemand(categoryValues?: Tables<"data_category_values">[]): number {
  if (!categoryValues || categoryValues.length === 0) return 70;
  
  const totalDemand = categoryValues.reduce((sum, cat) => {
    return sum + (cat.current_demand_factor || 1) * 100;
  }, 0);
  
  return Math.round(totalDemand / categoryValues.length);
}

/**
 * 메인 자산 가치 계산 함수
 */
export function calculateAssetValue(
  input: AssetValueInput,
  previousValue?: number
): AssetValueBreakdown {
  const { profile, categoryValues } = input;
  
  // 1. 기본 요소 계산
  const freshness = calculateDataFreshness(profile.data_last_updated);
  const completeness = profile.profile_completeness || 0;
  const verificationGrade = determineVerificationGrade(profile.is_verified, profile.trust_score);
  const marketDemand = calculateAverageMarketDemand(categoryValues);
  
  // 2. 배율 계산
  const freshnessMultiplier = freshness / 100;
  const { multiplier: completenessMultiplier, label: completenessLabel } = getCompletenessMultiplier(completeness);
  const verificationMultiplier = VERIFICATION_GRADE_MULTIPLIERS[verificationGrade];
  const demandMultiplier = marketDemand / 100;
  
  // 3. 카테고리별 가치 계산
  const userCategories = profile.data_categories || ['consumer'];
  const categoryBreakdown: AssetValueBreakdown['categoryBreakdown'] = [];
  
  let totalValue = 0;
  
  for (const [categoryKey, categoryInfo] of Object.entries(DATA_CATEGORY_BASE_VALUES)) {
    // 사용자가 해당 카테고리 데이터를 가지고 있는지 확인
    const hasCategory = userCategories.includes(categoryKey);
    if (!hasCategory) continue;
    
    // DB에서 해당 카테고리의 수요 팩터 조회
    const dbCategory = categoryValues?.find(c => c.category === categoryKey);
    const categoryDemandFactor = dbCategory?.current_demand_factor || 1;
    const categoryScarcityFactor = dbCategory?.current_scarcity_factor || 1;
    
    // 카테고리 가치 = 기본가 × 모든배율 × 수요 × 희소성
    const adjustedValue = Math.round(
      categoryInfo.baseValue 
      * freshnessMultiplier 
      * completenessMultiplier 
      * verificationMultiplier 
      * categoryDemandFactor
      * categoryScarcityFactor
    );
    
    totalValue += adjustedValue;
    
    categoryBreakdown.push({
      category: categoryKey,
      name: categoryInfo.name,
      baseValue: categoryInfo.baseValue,
      adjustedValue,
      demandFactor: categoryDemandFactor,
      contribution: 0, // 나중에 계산
    });
  }
  
  // 카테고리별 기여도 계산
  categoryBreakdown.forEach(cat => {
    cat.contribution = totalValue > 0 ? Math.round((cat.adjustedValue / totalValue) * 100) : 0;
  });
  
  // 4. 변화량 계산
  const valueChange = previousValue ? totalValue - previousValue : 0;
  const valueChangePercent = previousValue && previousValue > 0 
    ? ((totalValue - previousValue) / previousValue) * 100 
    : 0;
  
  // 5. 월 연금 계산 (월 3% 수익률 가정)
  const estimatedMonthlyPension = Math.round(totalValue * 0.03);
  
  // 6. 신뢰 지수 계산 (신선도, 완성도, 인증의 가중 평균)
  const confidenceIndex = Math.round(
    freshness * 0.3 + 
    completeness * 0.3 + 
    (verificationMultiplier * 40) * 0.4
  );
  
  // 7. 자산 등급 결정
  const assetGrade = determineAssetGrade(totalValue);
  const nextGradeThreshold = getNextGradeThreshold(assetGrade);
  const currentGradeThreshold = {
    bronze: 0,
    silver: 25000,
    gold: 45000,
    platinum: 70000,
    diamond: 100000,
  }[assetGrade];
  const progressToNextGrade = Math.min(100, Math.round(
    ((totalValue - currentGradeThreshold) / (nextGradeThreshold - currentGradeThreshold)) * 100
  ));
  
  return {
    totalValue,
    previousValue,
    valueChange,
    valueChangePercent,
    estimatedMonthlyPension,
    factors: {
      freshness,
      completeness,
      verificationGrade,
      marketDemand,
    },
    multipliers: {
      freshnessMultiplier,
      completenessMultiplier,
      verificationMultiplier,
      demandMultiplier,
    },
    categoryBreakdown,
    confidenceIndex,
    assetGrade,
    nextGradeThreshold,
    progressToNextGrade,
  };
}

/**
 * 가치를 원화 형식으로 포맷
 */
export function formatAssetValue(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * 가치 향상 팁 생성
 */
export function generateValueTips(breakdown: AssetValueBreakdown): string[] {
  const tips: string[] = [];
  
  if (breakdown.factors.freshness < 70) {
    tips.push("📊 데이터를 갱신하면 신선도가 올라 가치가 최대 40% 증가합니다");
  }
  
  if (breakdown.factors.completeness < 70) {
    tips.push("📝 프로필을 완성하면 가치가 최대 25% 증가합니다");
  }
  
  if (breakdown.factors.verificationGrade === 'none' || breakdown.factors.verificationGrade === 'silver') {
    tips.push("✅ 추가 인증을 진행하면 신뢰등급이 올라 가치가 상승합니다");
  }
  
  if (breakdown.categoryBreakdown.length < 3) {
    tips.push("📦 더 많은 카테고리 데이터를 연결하면 결합 가치가 증가합니다");
  }
  
  return tips;
}
