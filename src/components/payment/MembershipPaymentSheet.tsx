import { useState } from 'react';
import { Crown, Check, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import PaymentMethodSelector from './PaymentMethodSelector';
import { usePortonePayment, CHANNEL_KEYS, type PaymentMethod } from '@/hooks/usePortonePayment';
import { useToast } from '@/hooks/use-toast';

interface MembershipPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    id: string;
    name: string;
    nameKr: string;
    price: number;
    originalPrice?: number;
    features: string[];
  };
  billingCycle: 'monthly' | 'yearly';
  onComplete?: () => void;
}

export const MembershipPaymentSheet = ({
  open,
  onOpenChange,
  plan,
  billingCycle,
  onComplete,
}: MembershipPaymentSheetProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EASY_PAY');
  const [agreeToSubscription, setAgreeToSubscription] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { requestPayment } = usePortonePayment();
  const { toast } = useToast();

  const yearlyDiscount = 0.2;
  const finalPrice = billingCycle === 'yearly' 
    ? Math.round(plan.price * 12 * (1 - yearlyDiscount))
    : plan.price;

  const handlePayment = async () => {
    if (!agreeToSubscription || !agreeToTerms) {
      toast({
        title: '동의 필요',
        description: '정기결제 및 이용약관에 동의해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await requestPayment({
        amount: finalPrice,
        orderName: `VeriNode ${plan.name} 멤버십 (${billingCycle === 'yearly' ? '연간' : '월간'})`,
        paymentMethod,
        channelKey: CHANNEL_KEYS.KAKAOPAY,
        customData: {
          type: 'membership_subscription',
          planType: plan.id,
          billingCycle,
        },
      });

      if (!response.code) {
        toast({
          title: '멤버십 가입 완료!',
          description: `${plan.name} 멤버십이 활성화되었습니다.`,
        });
        onComplete?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: '결제 실패',
        description: '결제 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-violet-500" />
            멤버십 결제
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 플랜 요약 */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.nameKr} 멤버십</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {plan.features.slice(0, 4).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-violet-500" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
              {plan.features.length > 4 && (
                <p className="text-xs text-muted-foreground ml-6">
                  외 {plan.features.length - 4}개 혜택
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-violet-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {billingCycle === 'yearly' ? '연간 결제' : '월간 결제'}
                </span>
                <div className="text-right">
                  {plan.originalPrice && billingCycle === 'monthly' && (
                    <span className="text-sm text-muted-foreground line-through mr-2">
                      ₩{plan.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-xl font-bold text-foreground">
                    ₩{finalPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{billingCycle === 'yearly' ? '년' : '월'}
                  </span>
                </div>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-xs text-emerald-600 text-right mt-1">
                  연간 결제 시 20% 할인 적용
                </p>
              )}
            </div>
          </div>

          {/* 결제수단 선택 */}
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onMethodSelect={setPaymentMethod}
          />

          {/* 동의 항목 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <Checkbox
                id="subscription"
                checked={agreeToSubscription}
                onCheckedChange={(checked) => setAgreeToSubscription(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="subscription" className="text-sm text-foreground cursor-pointer">
                <span className="font-medium">정기결제 동의</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {billingCycle === 'yearly' ? '매년' : '매월'} 자동으로 결제되며, 
                  언제든지 설정에서 해지할 수 있습니다.
                </p>
              </label>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
                <span className="font-medium">이용약관 동의</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  멤버십 서비스 이용약관 및 개인정보 처리방침에 동의합니다.
                </p>
              </label>
            </div>
          </div>

          {/* 안내 */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">7일 무료 체험 가능</p>
              <p>
                첫 7일간 무료로 이용하실 수 있으며, 7일 이내 해지 시 요금이 청구되지 않습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 결제 버튼 */}
        <div className="sticky bottom-0 pt-4 bg-background">
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !agreeToSubscription || !agreeToTerms}
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-lg rounded-xl disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                결제 진행 중...
              </>
            ) : (
              <>
                ₩{finalPrice.toLocaleString()} 결제하기
              </>
            )}
          </Button>
          <p className="text-center text-muted-foreground text-xs mt-3">
            7일 무료 체험 후 자동 결제됩니다
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MembershipPaymentSheet;
