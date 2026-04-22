import { useState } from "react";
import { ArrowLeft, Coins, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";

interface DonationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donation: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  };
  balance: number;
  onDonate: (amount: number) => void;
}

const DonationSheet = ({ 
  open, 
  onOpenChange, 
  donation, 
  balance, 
  onDonate 
}: DonationSheetProps) => {
  const [amount, setAmount] = useState(10000);
  const [isProcessing, setIsProcessing] = useState(false);

  const quickAmounts = [1000, 5000, 10000];

  const handleQuickAmount = (value: number) => {
    setAmount(prev => Math.min(prev + value, balance));
  };

  const handleDonateAll = () => {
    setAmount(balance);
  };

  const handleDonate = async () => {
    if (amount <= 0) {
      toast({
        title: "금액 오류",
        description: "기부 금액을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "잔액 부족",
        description: "보유 수익금이 부족합니다.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate donation processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onDonate(amount);
    setIsProcessing(false);
    onOpenChange(false);
    setAmount(10000);
    
    toast({
      title: "기부 완료",
      description: `${donation.title}에 ${amount.toLocaleString()}원이 기부되었습니다.`,
    });
  };

  const Icon = donation.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between px-4 py-4 border-b border-border">
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h2 className="text-lg font-bold text-foreground">기부하기</h2>
          <div className="w-10" />
        </SheetHeader>

        <div className="p-6 space-y-6 overflow-y-auto h-[calc(90vh-180px)]">
          {/* Donation Project Card */}
          <div className={`${donation.bg} rounded-2xl p-4 flex items-center gap-4`}>
            <div className={`w-16 h-16 rounded-xl bg-card flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${donation.color}`} />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{donation.title} 기부</h3>
              <p className="text-sm text-muted-foreground">{donation.description}</p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">기부하실 금액을 입력해주세요</p>
            
            <div className="flex items-end justify-center gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.min(Number(e.target.value), balance))}
                className="text-4xl font-bold text-primary bg-transparent border-0 text-center w-48 focus:outline-none"
              />
              <span className="text-xl font-bold text-foreground mb-1">KRW</span>
            </div>
            
            <div className="w-32 h-1 bg-primary/30 rounded-full mx-auto">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min((amount / balance) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Balance Display */}
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-secondary rounded-full w-fit mx-auto">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              보유 수익금: <span className="font-bold text-foreground">{balance.toLocaleString()} KRW</span>
            </span>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {quickAmounts.map((value) => (
              <button
                key={value}
                onClick={() => handleQuickAmount(value)}
                className={`py-4 rounded-xl border-2 font-medium transition-all ${
                  amount === value 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                +{value.toLocaleString()}원
              </button>
            ))}
            <button
              onClick={handleDonateAll}
              className={`py-4 rounded-xl border-2 font-medium transition-all ${
                amount === balance 
                  ? "border-primary bg-primary/5 text-primary" 
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              전액 기부
            </button>
          </div>

          {/* Info Notice */}
          <div className="bg-secondary/50 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              기부금 영수증 발급을 위해 개인정보 제공 동의가 필요할 수 있습니다. 
              기부 내역은 마이페이지에서 언제든지 확인할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-14 rounded-xl text-base"
          >
            취소
          </Button>
          <Button
            onClick={handleDonate}
            disabled={isProcessing || amount <= 0 || amount > balance}
            className="flex-[2] h-14 rounded-xl text-base bg-primary hover:bg-primary/90"
          >
            {isProcessing ? "처리 중..." : "기부하기"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DonationSheet;
