/**
 * VeriNode 가격 책정 및 수익 분배 계산 유틸리티
 * 
 * 핵심 공식:
 * 구매가 = 기본가 × 샘플수 × 타겟정밀도계수 × 품질계수 × 긴급계수
 * 
 * 수익 분배:
 * - 플랫폼 수수료: 25%
 * - 공급자 보상 풀: 75% (기본 60% + 품질 인센티브 15%)
 */

// 등급별 배율
export const GRADE_MULTIPLIERS = {
  silver: 1.0,
  gold: 1.5,
  platinum: 2.2,
  diamond: 2.8,
} as const;

// 긴급도별 배율
export const URGENCY_MULTIPLIERS = {
  normal: 1.0,   // 7일 이상
  fast: 1.3,     // 3-7일
  urgent: 1.8,   // 3일 이내
} as const;

// 품질등급별 배율 (분석 데이터용)
export const QUALITY_MULTIPLIERS = {
  c_grade: 1.0,  // 기본
  b_grade: 1.2,  // 90%+
  a_grade: 1.8,  // 95%+
  s_grade: 2.5,  // 98%+
} as const;

// 기본 단가 (카테고리별)
export const BASE_PRICES = {
  survey: {
    general: 500,
    cross_verified: 700,
    api_verified: 1000,
  },
  analysis: {
    financial: 80,
    healthcare: 60,
    consumer: 40,
    mobility: 35,
  },
  raw_data: {
    financial: 100,
    healthcare: 80,
    consumer: 50,
  },
} as const;

// 수익 분배 비율
export const REVENUE_SHARES = {
  platform_fee_percent: 25,
  supplier_base_percent: 60,
  quality_bonus_percent: 15,
} as const;

export interface PricingInput {
  productType: 'survey' | 'analysis' | 'raw_data';
  subCategory: string;
  sampleCount: number;
  targetGrade: keyof typeof GRADE_MULTIPLIERS;
  urgency: keyof typeof URGENCY_MULTIPLIERS;
  hasCrossVerification?: boolean;
  qualityGrade?: keyof typeof QUALITY_MULTIPLIERS;
}

export interface PricingBreakdown {
  basePrice: number;
  basePricePerUnit: number;
  sampleCount: number;
  gradeMultiplier: number;
  urgencyMultiplier: number;
  qualityMultiplier: number;
  crossVerificationFee: number;
  totalPrice: number;
  platformFee: number;
  supplierPool: number;
  estimatedPerSupplier: {
    silver: number;
    gold: number;
    platinum: number;
  };
}

/**
 * 구매 가격 계산
 */
export function calculatePurchasePrice(input: PricingInput): PricingBreakdown {
  const {
    productType,
    subCategory,
    sampleCount,
    targetGrade,
    urgency,
    hasCrossVerification = false,
    qualityGrade = 'c_grade',
  } = input;

  // 기본 단가 조회
  const categoryPrices = BASE_PRICES[productType] as Record<string, number>;
  const basePricePerUnit = categoryPrices[subCategory] || 500;

  // 배율 조회
  const gradeMultiplier = GRADE_MULTIPLIERS[targetGrade];
  const urgencyMultiplier = URGENCY_MULTIPLIERS[urgency];
  const qualityMultiplier = productType === 'analysis' 
    ? QUALITY_MULTIPLIERS[qualityGrade] 
    : 1.0;

  // 기본 가격 계산
  let basePrice = basePricePerUnit * sampleCount;
  
  // 배율 적용
  basePrice = Math.round(basePrice * gradeMultiplier * urgencyMultiplier * qualityMultiplier);

  // 교차검증 추가 비용 (설문에만 적용, 20% 추가)
  const crossVerificationFee = hasCrossVerification && productType === 'survey' 
    ? Math.round(basePrice * 0.2) 
    : 0;

  // 총 가격
  const totalPrice = basePrice + crossVerificationFee;

  // 수익 분배
  const platformFee = Math.round(totalPrice * (REVENUE_SHARES.platform_fee_percent / 100));
  const supplierPool = totalPrice - platformFee;

  // 공급자 1인당 예상 보상 (등급별)
  const basePerSupplier = Math.round(supplierPool / sampleCount);
  const estimatedPerSupplier = {
    silver: basePerSupplier,
    gold: Math.round(basePerSupplier * 1.25),      // +25%
    platinum: Math.round(basePerSupplier * 1.5),   // +50%
  };

  return {
    basePrice,
    basePricePerUnit,
    sampleCount,
    gradeMultiplier,
    urgencyMultiplier,
    qualityMultiplier,
    crossVerificationFee,
    totalPrice,
    platformFee,
    supplierPool,
    estimatedPerSupplier,
  };
}

/**
 * 공급자 개별 보상 계산
 */
export interface SupplierRewardInput {
  supplierPool: number;
  totalSuppliers: number;
  supplierTrustScore: number;
  isVerified: boolean;
  profileCompleteness: number;
  dataFreshnessDays: number;
}

export interface SupplierReward {
  baseAmount: number;
  verificationBonus: number;
  completenessBonus: number;
  freshnessBonus: number;
  totalAmount: number;
  bonusBreakdown: {
    verification: number;
    completeness: number;
    freshness: number;
  };
}

export function calculateSupplierReward(input: SupplierRewardInput): SupplierReward {
  const {
    supplierPool,
    totalSuppliers,
    supplierTrustScore,
    isVerified,
    profileCompleteness,
    dataFreshnessDays,
  } = input;

  // 기본 보상 (공급자 풀의 80%를 균등 분배)
  const basePool = supplierPool * 0.8;
  const bonusPool = supplierPool * 0.2;
  
  const baseAmount = Math.round(basePool / totalSuppliers);

  // 품질 보너스 계산
  // 1. 인증 보너스 (최대 10%)
  const verificationBonus = isVerified 
    ? Math.round((bonusPool / totalSuppliers) * 0.4) 
    : 0;

  // 2. 완성도 보너스 (최대 5%)
  const completenessBonus = Math.round(
    (bonusPool / totalSuppliers) * 0.3 * (profileCompleteness / 100)
  );

  // 3. 신선도 보너스 (7일 이내 데이터, 최대 5%)
  const freshnessMultiplier = dataFreshnessDays <= 7 
    ? 1 - (dataFreshnessDays / 7) * 0.5 
    : 0;
  const freshnessBonus = Math.round(
    (bonusPool / totalSuppliers) * 0.3 * freshnessMultiplier
  );

  const totalAmount = baseAmount + verificationBonus + completenessBonus + freshnessBonus;

  return {
    baseAmount,
    verificationBonus,
    completenessBonus,
    freshnessBonus,
    totalAmount,
    bonusBreakdown: {
      verification: verificationBonus,
      completeness: completenessBonus,
      freshness: freshnessBonus,
    },
  };
}

/**
 * 프로필 완성도 계산
 */
export interface ProfileForCompleteness {
  display_name?: string | null;
  occupation?: string | null;
  company?: string | null;
  industry?: string | null;
  age_group?: string | null;
  gender?: string | null;
  region?: string | null;
  introduction?: string | null;
  sns_keywords?: string[] | null;
  is_verified?: boolean | null;
}

export function calculateProfileCompleteness(profile: ProfileForCompleteness): number {
  const weights: Record<string, number> = {
    display_name: 5,
    occupation: 10,
    company: 10,
    industry: 10,
    age_group: 10,
    gender: 5,
    region: 10,
    introduction: 10,
    sns_keywords: 10, // 3개 이상일 때
    is_verified: 20,
  };

  let score = 0;

  if (profile.display_name) score += weights.display_name;
  if (profile.occupation) score += weights.occupation;
  if (profile.company) score += weights.company;
  if (profile.industry) score += weights.industry;
  if (profile.age_group) score += weights.age_group;
  if (profile.gender) score += weights.gender;
  if (profile.region) score += weights.region;
  if (profile.introduction) score += weights.introduction;
  if (profile.sns_keywords && profile.sns_keywords.length >= 3) {
    score += weights.sns_keywords;
  }
  if (profile.is_verified) score += weights.is_verified;

  return Math.min(score, 100);
}

/**
 * 데이터 신선도 계산 (0~1)
 */
export function calculateFreshnessFactor(lastUpdated: Date | string | null): number {
  if (!lastUpdated) return 0.5;

  const now = new Date();
  const updated = new Date(lastUpdated);
  const hoursSinceUpdate = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);

  // 24시간 이내: 100%
  if (hoursSinceUpdate <= 24) return 1.0;

  // 그 후 시간당 1%씩 감소, 최소 50%
  const decayRate = 0.01;
  const decay = (hoursSinceUpdate - 24) * decayRate;
  
  return Math.max(0.5, 1 - decay);
}

/**
 * 가격을 한국 원화 형식으로 포맷
 */
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}
