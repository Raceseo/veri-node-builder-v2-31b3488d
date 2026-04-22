import { useState } from 'react';
import { Coins, Gift, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import PaymentMethodSelector from './PaymentMethodSelector';
import { usePortonePayment, CHANNEL_KEYS, type PaymentMethod } from '@/hooks/usePortonePayment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VNChargeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (amount: number, bonusVN: number) => void;
}

interface ChargeOption {
  krwAmount: number;
  vnAmount: number;
  bonusVN: number;
  bonusPercent: number;
  popular?: boolean;
}

const CHARGE_OPTIONS: ChargeOption[] = [
  { krwAmount: 10000, vnAmount: 10000, bonusVN: 0, bonusPercent: 0 },
  { krwAmount: 30000, vnAmount: 30000, bonusVN: 1500, bonusPercent: 5 },
  { krwAmount: 50000, vnAmount: 50000, bonusVN: 5000, bonusPercent: 10, popular: true },
  { krwAmount: 100000, vnAmount: 100000, bonusVN: 15000, bonusPercent: 15 },
];

export const VNChargeSheet = ({ open, onOpenChange, onComplete }: VNChargeSheetProps) => {
  const [selectedOption, setSelectedOption] = useState<ChargeOption>(CHARGE_OPTIONS[2]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EASY_PAY');
  const [isProcessing, setIsProcessing] = useState(false);
  const { requestPayment } = usePortonePayment();
  const { toast } = useToast();

  const handleCharge = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: '로그인 필요',
          description: '충전하려면 로그인이 필요합니다.',
          variant: 'destructive',
        });
        return;
      }

      const response = await requestPayment({
        amount: selectedOption.krwAmount,
        orderName: `VN 토큰 ${selectedOption.vnAmount.toLocaleString()} 충전`,
        paymentMethod,
        channelKey: CHANNEL_KEYS.KAKAOPAY,
        customData: {
          type: 'vn_charge',
          vnAmount: selectedOption.vnAmount,
          bonusVN: selectedOption.bonusVN,
        },
      });

      // V2: code가 없으면 성공
      if (!response.code) {
        // 서버에서 이미 검증 완료, VN 충전은 webhook에서 자동 처리
        onComplete?.(selectedOption.vnAmount, selectedOption.bonusVN);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Charge error:', error);
      toast({
        title: '충전 실패',
        description: '결제 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            VN 토큰 충전
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* 충전 금액 선택 */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">충전 금액 선택</h4>
            <div className="grid grid-cols-2 gap-3">
              {CHARGE_OPTIONS.map((option) => (
                <button
                  key={option.krwAmount}
                  onClick={() => setSelectedOption(option)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all text-left",
                    selectedOption.krwAmount === option.krwAmount
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {option.popular && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      인기
                    </div>
                  )}
                  <p className="text-lg font-bold text-foreground">
                    ₩{option.krwAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {option.vnAmount.toLocaleString()} VN
                  </p>
                  {option.bonusVN > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-primary text-xs font-medium">
                      <Gift className="w-3 h-3" />
                      +{option.bonusVN.toLocaleString()} VN ({option.bonusPercent}% 보너스)
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 충전 요약 */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">결제 금액</span>
              <span className="font-bold text-foreground">₩{selectedOption.krwAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">기본 VN</span>
              <span className="text-foreground">{selectedOption.vnAmount.toLocaleString()} VN</span>
            </div>
            {selectedOption.bonusVN > 0 && (
              <div className="flex items-center justify-between mb-2 text-primary">
                <span className="text-sm flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  보너스 VN
                </span>
                <span className="font-medium">+{selectedOption.bonusVN.toLocaleString()} VN</span>
              </div>
            )}
            <div className="pt-2 border-t border-primary/20 flex items-center justify-between">
              <span className="font-medium text-foreground">총 충전 VN</span>
              <span className="text-xl font-bold text-primary">
                {(selectedOption.vnAmount + selectedOption.bonusVN).toLocaleString()} VN
              </span>
            </div>
          </div>

          {/* 결제수단 선택 */}
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onMethodSelect={setPaymentMethod}
          />

          {/* 안내 */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              VN 토큰은 데이터 구매, 프리미엄 기능 이용 등에 사용됩니다. 
              충전된 VN은 환불이 불가하며, 서비스 이용 약관에 따라 관리됩니다.
            </p>
          </div>
        </div>

        {/* 결제 버튼 */}
        <div className="sticky bottom-0 pt-4 bg-background">
          <Button
            onClick={handleCharge}
            disabled={isProcessing}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold text-lg rounded-xl"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                결제 진행 중...
              </>
            ) : (
              <>
                ₩{selectedOption.krwAmount.toLocaleString()} 결제하기
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VNChargeSheet;
