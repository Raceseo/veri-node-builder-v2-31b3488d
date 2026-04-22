import { Check, DollarSign, Sparkles, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import VeriNodeLogo from "@/components/VeriNodeLogo";

interface SuccessViewProps {
  amount: number;
  onContinue: (amount: number) => void;
  onGoHome: () => void;
}

const SuccessView = ({ amount, onContinue, onGoHome }: SuccessViewProps) => {
  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <VeriNodeLogo />
        <div className="w-6 h-6" />
      </header>

      {/* Trust Score Card */}
      <div className="px-4 mt-2">
        <div className="bg-card rounded-2xl p-5 shadow-card border-t-4 border-primary relative overflow-hidden">
          <div className="absolute top-4 right-4 w-12 h-12">
            <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-1">
            현재 신뢰 점수 (TRUST SCORE)
          </p>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl font-bold text-primary">Level 3</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning flex items-center gap-1">
              ★ MAX
            </span>
          </div>

          <div className="space-y-2">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary rounded-full w-full" />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">0</span>
              <span className="text-primary font-medium">500 / 500 pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Celebration */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative">
        {/* Confetti Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-8 w-3 h-3 bg-pink-400 rounded-sm rotate-12 animate-bounce" style={{ animationDelay: "0.1s" }} />
          <div className="absolute top-32 left-20 w-2 h-2 bg-green-400 rounded-sm rotate-45 animate-bounce" style={{ animationDelay: "0.3s" }} />
          <div className="absolute top-16 right-16 w-4 h-4 bg-yellow-400 rotate-12 animate-bounce" style={{ animationDelay: "0.2s" }}>
            <Sparkles className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="absolute top-40 right-8 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
          <div className="absolute bottom-40 left-12 w-2 h-4 bg-pink-300 rotate-12 animate-bounce" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-24 left-1/3 w-3 h-3 text-blue-400">★</div>
        </div>

        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-success flex items-center justify-center">
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-8">
          인증 성공!
        </h2>

        {/* Reward Card */}
        <div className="w-full bg-warning/10 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-warning/20 mx-auto mb-3 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-warning" />
          </div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
            VeriNode Reward
          </p>
          <p className="text-3xl font-bold text-foreground mb-2">
            +{amount.toLocaleString()} KRW
          </p>
          <span className="inline-block px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
            적립 완료
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-8 space-y-3">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 h-14 text-base font-medium"
          onClick={() => onContinue(amount)}
        >
          <ArrowRight className="w-5 h-5 mr-2" />
          추가 수익 인증하기
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-14 text-base font-medium"
          onClick={onGoHome}
        >
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
};

export default SuccessView;