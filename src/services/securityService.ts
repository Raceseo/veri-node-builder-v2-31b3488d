import { supabase } from '@/integrations/supabase/client';

export interface TransactionSignature {
  admin1_signed: boolean;
  admin2_signed: boolean;
  timestamp: number;
}

export const securityService = {
  // 설정 상수
  HIGH_VALUE_THRESHOLD: 10000000, // 1,000만원
  MAX_TRANSACTIONS_PER_BLOCK: 100, // 대량 거래 부하 방지 임계값

  /**
   * 미션 1: 2인 관리자 승인 로직 (Dual Approval)
   * 1,000만원 이상 거래 시 반드시 두 명의 관리자 서명이 필요함
   */
  verifyDualApproval: async (amount: number, signatures: TransactionSignature): Promise<boolean> => {
    if (amount < securityService.HIGH_VALUE_THRESHOLD) {
      return true; // 임계값 미만은 자동 승인 가능
    }

    if (!signatures.admin1_signed || !signatures.admin2_signed) {
      console.warn(`[Security Alert] High value transaction (${amount}) missing dual signatures.`);
      return false;
    }

    // 서명 유효 시간 검증 (5분 이내)
    const timeDiff = Date.now() - signatures.timestamp;
    if (timeDiff > 5 * 60 * 1000) {
      throw new Error('SECURITY_TIMEOUT: 관리자 승인 세션이 만료되었습니다.');
    }

    return true;
  },

  /**
   * 미션 1: 대량 거래 부하 방지 (Load Prevention)
   * 현재 처리 중인 트랜잭션 큐를 확인하여 시스템 과부하 방지
   */
  checkSystemLoad: async (): Promise<void> => {
    // 실제 구현 시 Redis나 DB 카운터 활용
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');

    if (error) throw error;

    if (count !== null && count >= securityService.MAX_TRANSACTIONS_PER_BLOCK) {
      throw new Error('SYSTEM_OVERLOAD: 현재 처리량이 많아 잠시 후 다시 시도해주세요.');
    }
  },

  /**
   * 암호화 유틸리티 (AES-256 Mock)
   * 민감 정보 로깅 방지용 마스킹
   */
  maskSensitiveData: (data: string): string => {
    if (!data || data.length < 4) return '****';
    return data.slice(0, 2) + '*'.repeat(data.length - 4) + data.slice(-2);
  }
};