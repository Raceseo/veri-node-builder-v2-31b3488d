import { supabase } from '@/integrations/supabase/client';
import { securityService, TransactionSignature } from './securityService';

interface SettlementRequest {
  userId: string;
  amount: number;
  bankAccount: string;
  hasDmPermission: boolean; // 마케팅 DM 수신 동의 여부
  adminSignatures?: TransactionSignature;
}

export const walletService = {
  /**
   * 정산 및 출금 처리 메인 로직
   * 미션 3: 1,000만원 이상 대량 정산 시 2인 승인 검증
   * 미션 4: DM 권한 패키지 포함 시 가중 정산 로직
   */
  processSettlement: async (request: SettlementRequest) => {
    console.log(`[Wallet] Processing settlement for ${request.userId}`);

    try {
      // 1. 시스템 부하 체크 (Security Service)
      await securityService.checkSystemLoad();

      // 2. 가중 정산 로직 계산 (Marketing Integration)
      let finalAmount = request.amount;
      let rateApplied = 1.0;

      if (request.hasDmPermission) {
        // DM 권한 패키지가 포함된 경우 5% 가산점 부여 (예시)
        rateApplied = 1.05;
        finalAmount = Math.floor(request.amount * rateApplied);
        console.log(`[Marketing] DM Package applied. Rate: ${rateApplied}, Bonus: ${finalAmount - request.amount}`);
      }

      // 3. 고액 거래 보안 검증 (Mission 3)
      // 1,000만원 이상일 경우 adminSignatures가 필수이며 유효해야 함
      if (finalAmount >= securityService.HIGH_VALUE_THRESHOLD) {
        if (!request.adminSignatures) {
          throw new Error('SECURITY_REQUIRED: 고액 출금은 관리자 서명 객체가 필요합니다.');
        }

        const isAuthorized = await securityService.verifyDualApproval(finalAmount, request.adminSignatures);
        if (!isAuthorized) {
          throw new Error('ACCESS_DENIED: 관리자 2인 승인이 완료되지 않았습니다.');
        }
      }

      // 4. DB 트랜잭션 기록 (Supabase Mock)
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: request.userId,
          amount: finalAmount,
          bonus_amount: finalAmount - request.amount,
          bank_info: { masked_account: securityService.maskSensitiveData(request.bankAccount) },
          security_metadata: { rate_applied: rateApplied, verified_by_admin: finalAmount >= securityService.HIGH_VALUE_THRESHOLD },
          type: 'settlement',
          status: 'completed',
          total_amount: finalAmount,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      return {
        success: true,
        transactionId: data[0].id,
        finalAmount,
        message: '정산이 성공적으로 처리되었습니다.'
      };

    } catch (error: any) {
      console.error('[Wallet Service Error]', error);
      return {
        success: false,
        message: error.message || '정산 처리 중 오류 발생'
      };
    }
  },

  /**
   * 예상 정산금 조회 (시뮬레이션용)
   */
  calculateEstimatedSettlement: (baseAmount: number, hasDmPermission: boolean) => {
    const multiplier = hasDmPermission ? 1.05 : 1.0;
    return Math.floor(baseAmount * multiplier);
  }
};