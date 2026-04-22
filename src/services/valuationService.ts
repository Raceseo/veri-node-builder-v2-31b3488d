import { supabase } from '@/integrations/supabase/client';

export interface AssetValuationResult {
  isValid: boolean;
  marketValue: number;
  synergyBonus: number;
  finalAmount: number;
  exchangeRate: number;
  message: string;
}

/**
 * VeriNode Data Valuation Engine
 * Mission 4: 마케팅 연동(DM 권한 패키지) 가중 정산 로직 포함
 */
export const valuationService = {
  BASE_EXCHANGE_RATE: 10, // 1 VN = 10 KRW (Mock)

  getExchangeRate: async (): Promise<number> => {
    // 실제로는 시장 수요/공급에 따라 변동
    return valuationService.BASE_EXCHANGE_RATE;
  },

  /**
   * 데이터 시너지 보너스 계산
   * @param baseAmount 기본 금액
   * @param trustScore 신뢰 점수
   * @param continuityDays 연속 기여일
   * @param dmOptIn 마케팅(DM) 수신 동의 여부 (Mission 4 핵심)
   */
  getSynergyBonus: (baseAmount: number, trustScore: number, continuityDays: number = 0, dmOptIn: boolean = false): number => {
    // 1. 신뢰 점수 가중치 (최대 20%)
    const trustMultiplier = Math.max(0, (trustScore - 80) * 0.01);
    
    // 2. 연속 기여 가중치 (최대 5%)
    // 7일 이상 연속 기여 시 보너스
    const continuityMultiplier = continuityDays >= 7 ? 0.05 : 0;

    // 3. 마케팅(DM) 패키지 가중치 (Mission 4: 10% 추가 보너스)
    // 기업이 직접 마케팅할 수 있는 권한을 제공하면 데이터 가치 상승
    const marketingMultiplier = dmOptIn ? 0.10 : 0;

    const totalRate = trustMultiplier + continuityMultiplier + marketingMultiplier;
    return Math.floor(baseAmount * totalRate);
  },

  evaluateDataAsset: async (userId: string, vnAmount: number, dmOptIn: boolean = false): Promise<AssetValuationResult> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('trust_score, reputation_score')
      .eq('id', userId)
      .single();

    const trustScore = profile?.trust_score || 0;
    
    // 최소 신뢰 점수 체크
    if (trustScore < 30) {
      return {
        isValid: false,
        marketValue: 0,
        synergyBonus: 0,
        finalAmount: 0,
        exchangeRate: 0,
        message: '신뢰 점수가 너무 낮아 자산 가치를 평가할 수 없습니다.'
      };
    }

    const exchangeRate = await valuationService.getExchangeRate();
    const marketValue = vnAmount * exchangeRate;
    
    // 연속 기여일은 실제 DB 조회 필요 (여기서는 Mock)
    const continuityDays = 7; 
    
    // Mission 4: DM Opt-in Pass through for bonus calculation
    const synergyBonusVN = valuationService.getSynergyBonus(vnAmount, trustScore, continuityDays, dmOptIn);
    
    const finalVN = vnAmount + synergyBonusVN;
    const finalKRW = finalVN * exchangeRate;

    return {
      isValid: true,
      marketValue,
      synergyBonus: synergyBonusVN,
      finalAmount: finalKRW,
      exchangeRate,
      message: '자산 가치 평가 완료 (마케팅 및 신뢰도 가중치 적용됨)'
    };
  }
};
