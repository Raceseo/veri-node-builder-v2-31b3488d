import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * PortOne V2 SDK 타입 선언
 * - V1의 window.IMP 대신 window.PortOne 사용
 */
declare global {
  interface Window {
    PortOne: any;
  }
}

interface PortOneV2PaymentRequest {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: string;
  payMethod: string;
  redirectUrl?: string;
  customer?: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
  };
  customData?: Record<string, unknown>;
}

interface PortOneV2PaymentResponse {
  code?: string;
  message?: string;
  paymentId?: string;
  transactionType?: string;
  txId?: string;
}

export type PaymentMethod = 'CARD' | 'EASY_PAY' | 'TRANSFER';

interface PaymentOptions {
  amount: number;
  orderName: string;
  paymentMethod: PaymentMethod;
  channelKey: string;
  buyerEmail?: string;
  buyerName?: string;
  buyerTel?: string;
  customData?: Record<string, unknown>;
}

// PortOne V2 Store ID (publishable — 클라이언트에서 사용 가능)
const STORE_ID = 'store-cb3ae162-730e-4c8b-8ad2-b45705bcc3a9';

// 결제 수단별 Channel Key 매핑
export const CHANNEL_KEYS = {
  KAKAOPAY: 'channel-key-c5de175d-e218-4170-a754-35e9d0cee27f',
  // 토스페이, KG이니시스 채널키는 발급 후 추가
  // TOSSPAY: 'channel-key-xxx',
  // INICIS_CARD: 'channel-key-xxx',
} as const;

export const usePortonePayment = () => {
  const { toast } = useToast();

  /**
   * PortOne V2 SDK 로드 확인
   */
  const isSDKLoaded = useCallback((): boolean => {
    if (window.PortOne) return true;
    console.warn('PortOne V2 SDK not loaded');
    return false;
  }, []);

  /**
   * 서버에서 결제 주문 생성 (기존 로직 유지)
   */
  const createPaymentOrder = useCallback(async (options: PaymentOptions) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다');

    const { data, error } = await supabase.functions.invoke('create-payment-order', {
      body: {
        amount: options.amount,
        orderName: options.orderName,
        paymentMethod: options.paymentMethod,
        customData: options.customData,
      },
    });

    if (error) throw error;
    return data;
  }, []);

  /**
   * PortOne V2 결제 요청
   */
  const requestPayment = useCallback(async (options: PaymentOptions): Promise<PortOneV2PaymentResponse> => {
    if (!isSDKLoaded()) {
      throw new Error('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    }

    // 1. 서버에서 결제 주문 생성
    const orderData = await createPaymentOrder(options);
    const paymentId = orderData.merchantUid || `payment_${Date.now()}`;

    // 2. PortOne V2 결제창 호출
    const response = await window.PortOne.requestPayment({
      storeId: STORE_ID,
      channelKey: options.channelKey,
      paymentId,
      orderName: options.orderName,
      totalAmount: options.amount,
      currency: 'KRW',
      payMethod: options.paymentMethod,
      redirectUrl: `${window.location.origin}/payment/complete`,
      customer: {
        email: options.buyerEmail,
        fullName: options.buyerName,
        phoneNumber: options.buyerTel,
      },
    });

    // 3. 에러 체크 (사용자 취소 등)
    if (response.code) {
      toast({
        title: '결제 실패',
        description: response.message || '결제가 취소되었습니다.',
        variant: 'destructive',
      });
      return response;
    }

    // 4. 서버에서 결제 검증
    try {
      const { data, error } = await supabase.functions.invoke('verify-portone-payment', {
        body: {
          paymentId,
          expectedAmount: options.amount,
        },
      });

      if (error || !data?.success) {
        toast({
          title: '결제 검증 실패',
          description: '결제가 완료되었으나 검증에 실패했습니다. 고객센터에 문의해주세요.',
          variant: 'destructive',
        });
        return { ...response, code: 'VERIFY_FAILED', message: '결제 검증 실패' };
      }

      toast({
        title: '결제 완료',
        description: `${options.orderName} 결제가 완료되었습니다.`,
      });
      return response;
    } catch (err) {
      return { ...response, code: 'VERIFY_ERROR', message: '결제 검증 중 오류 발생' };
    }
  }, [isSDKLoaded, createPaymentOrder, toast]);

  return {
    requestPayment,
    isSDKLoaded,
    STORE_ID,
    CHANNEL_KEYS,
  };
};

export default usePortonePayment;
