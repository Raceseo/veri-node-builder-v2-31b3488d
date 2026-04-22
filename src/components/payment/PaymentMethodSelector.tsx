import { useState } from 'react';
import { CreditCard, Smartphone, Building2, Check, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentMethod } from '@/hooks/usePortonePayment';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodSelect: (method: PaymentMethod) => void;
  showPhonePayment?: boolean;
  showBankTransfer?: boolean;
}

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const EASY_PAY_OPTIONS: PaymentOption[] = [
  {
    id: 'EASY_PAY',
    name: '카카오페이',
    icon: <div className="w-6 h-6 bg-[#FEE500] rounded-md flex items-center justify-center text-[10px] font-bold text-black">K</div>,
    description: '카카오톡으로 간편 결제',
  },
];

export const PaymentMethodSelector = ({
  selectedMethod,
  onMethodSelect,
  showPhonePayment = false,
  showBankTransfer = false,
}: PaymentMethodSelectorProps) => {
  const [showAllMethods, setShowAllMethods] = useState(false);

  return (
    <div className="space-y-4">
      {/* 간편결제 섹션 */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">간편결제</h4>
        <div className="grid grid-cols-3 gap-2">
          {EASY_PAY_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onMethodSelect(option.id)}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                selectedMethod === option.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              {selectedMethod === option.id && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
              {option.icon}
              <span className="text-xs font-medium text-foreground">{option.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 카드결제 */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">카드결제</h4>
        <button
          onClick={() => onMethodSelect('CARD')}
          className={cn(
            "w-full relative p-4 rounded-xl border-2 transition-all flex items-center gap-3",
            selectedMethod === 'CARD'
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          {selectedMethod === 'CARD' && (
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">신용/체크카드</p>
            <p className="text-xs text-muted-foreground">채널키 등록 후 사용 가능</p>
          </div>
        </button>
      </div>

      {/* 추가 결제수단 */}
      {showBankTransfer && (
        <div>
          <button
            onClick={() => setShowAllMethods(!showAllMethods)}
            className="text-sm text-primary font-medium mb-3"
          >
            {showAllMethods ? '간편 보기' : '다른 결제수단 보기'}
          </button>

          {showAllMethods && (
            <div className="space-y-2">
              <button
                onClick={() => onMethodSelect('TRANSFER')}
                className={cn(
                  "w-full relative p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                  selectedMethod === 'TRANSFER'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                {selectedMethod === 'TRANSFER' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">실시간 계좌이체</p>
                  <p className="text-xs text-muted-foreground">채널키 등록 후 사용 가능</p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
