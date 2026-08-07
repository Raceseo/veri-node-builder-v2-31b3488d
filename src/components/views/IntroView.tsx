import { Button } from "@/components/ui/button";
import { Shield, Sparkles, ChevronRight } from "lucide-react";

interface IntroViewProps {
  onStart: () => void;
}

const IntroView = ({ onStart }: IntroViewProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-dark via-navy to-navy flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Pattern - Trust Colors */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(217 91% 60% / 0.15) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, hsl(168 76% 36% / 0.12) 0%, transparent 50%)`
          }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" 
          style={{
            backgroundImage: `linear-gradient(hsl(0 0% 100% / 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(0 0% 100% / 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Logo and Badge */}
      <div className="relative mb-10 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        <div className="relative">
          {/* Glow effect - Trust Blue */}
          <div className="absolute inset-0 -m-6 rounded-full bg-trust/25 blur-2xl animate-pulse" />
          
          {/* Shield Badge */}
          <div className="relative w-28 h-28 animate-float-gentle">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-trust to-trustTeal flex items-center justify-center shadow-2xl border border-white/10">
              <Shield className="w-14 h-14 text-white" />
            </div>
            
            {/* Trust Teal accent corners */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-trust-light rounded-full glow-trust" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-trustTeal rounded-full" />
          </div>
        </div>
      </div>

      {/* Brand Name */}
      <div className="text-center z-10 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          VeriNode
        </h1>
        <p className="text-sm text-trust-light font-medium tracking-widest uppercase">
          Data Trust Platform
        </p>
      </div>

      {/* Divider - Trust Gradient */}
      <div className="w-16 h-0.5 my-8 animate-fade-in rounded-full" style={{ animationDelay: '0.7s', animationFillMode: 'both', background: 'linear-gradient(90deg, transparent, hsl(217 91% 60%), hsl(168 76% 36%), transparent)' }} />

      {/* Main Headline */}
      <div className="text-center z-10 animate-fade-in" style={{ animationDelay: '0.9s', animationFillMode: 'both' }}>
        <h2 className="text-2xl font-bold text-white mb-3">
          당신의 진실에 가치를 매기다
        </h2>
        <p className="text-base text-white/75 leading-relaxed max-w-xs">
          우리는 거대 IT 기업이 독점하던
          <br />
          <span className="text-trust-light font-medium">데이터 주권</span>을 당신에게 돌려줍니다
        </p>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-sm animate-fade-in" style={{ animationDelay: '1.1s', animationFillMode: 'both' }}>
        {/* B-21: "안전한·투명한·완벽한" 3개 모두 검증되지 않은 수식어였다.
            지킬 수 있는 사실만 남긴다(정의서 §5). */}
        {['내 데이터 직접 관리', '설문 참여로 보상 적립', '내 정보는 내가 관리'].map((feature, i) => (
          <div 
            key={feature}
            className="px-4 py-2 rounded-full bg-trust/10 border border-trust/30 text-white/80 text-sm"
          >
            {feature}
          </div>
        ))}
      </div>

      {/* CTA Button - Trust Gradient */}
      <div className="mt-10 z-10 animate-fade-in" style={{ animationDelay: '1.3s', animationFillMode: 'both' }}>
        <Button
          onClick={onStart}
          size="xl"
          className="bg-gradient-to-r from-trust to-trustTeal hover:from-trust-light hover:to-trustTeal-light text-white font-bold shadow-lg shadow-trust/30 hover:shadow-trust/50 transition-all duration-300"
        >
          시작하기
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="flex items-center gap-6 mt-8 text-white/70 text-sm animate-fade-in" style={{ animationDelay: '1.5s', animationFillMode: 'both' }}>
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-trust" />
          <span>보안 인증</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-trustTeal" />
          <span>개인정보 보호</span>
        </div>
      </div>
    </div>
  );
};

export default IntroView;