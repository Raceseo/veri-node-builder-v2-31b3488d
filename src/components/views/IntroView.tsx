import { Button } from "@/components/ui/button";
import { Shield, ChevronRight } from "lucide-react";

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
        {/* tracking-widest·uppercase 제거: 영문 전용 타이포다.
            한글에 자간을 벌리면 "데 이 터  신 탁  플 랫 폼"이 되어 부제가 안 읽힌다. */}
        <p className="text-sm text-trust-light font-medium">
          데이터 신탁 플랫폼
        </p>
      </div>

      {/* Divider - Trust Gradient */}
      <div className="w-16 h-0.5 my-8 animate-fade-in rounded-full" style={{ animationDelay: '0.7s', animationFillMode: 'both', background: 'linear-gradient(90deg, transparent, hsl(217 91% 60%), hsl(168 76% 36%), transparent)' }} />

      {/* Main Headline */}
      <div className="text-center z-10 animate-fade-in" style={{ animationDelay: '0.9s', animationFillMode: 'both' }}>
        <h2 className="text-2xl font-bold text-white mb-3">
          내 데이터의 값을 받는 곳
        </h2>
        {/* 설문 보상(1회성)과 마이데이터 사용료(반복)를 구분해 쓴다.
            마이데이터는 자격 요건 미충족이라 시점을 약속하지 않는다 — "만들고 있습니다"까지만
            (구조정의서 §4). "연결만 하면 돈이 생긴다" 류 표현 금지: 지금 연결할 것이 없다. */}
        <p className="text-base text-white/75 leading-relaxed max-w-xs">
          지금은 설문에 답하면 보상이 쌓입니다.
          <br />
          앞으로는 내 데이터가 쓰일 때마다
          <br />
          사용료가 돌아오는 구조를 만들고 있습니다.
        </p>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-sm animate-fade-in" style={{ animationDelay: '1.1s', animationFillMode: 'both' }}>
        {/* B-21: "안전한·투명한·완벽한" 3개 모두 검증되지 않은 수식어였다.
            지킬 수 있는 사실만 남긴다(정의서 §5). */}
        {['3~4분이면 끝', '답한 만큼 적립', '내 데이터는 내가 주인'].map((feature, i) => (
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

      {/* 초기 단계 고지 — 종전 "보안 인증"·"개인정보 보호" 배지를 대체한다.
          정상 서비스는 첫 화면에 "안전해요"를 붙이지 않는다. 강조할수록 의심받는다.
          한계를 먼저 밝히는 쪽이 신뢰를 만든다. */}
      <div className="mt-8 max-w-xs text-center animate-fade-in" style={{ animationDelay: '1.5s', animationFillMode: 'both' }}>
        <p className="text-xs text-white/60 leading-relaxed">
          지금은 초기 단계입니다. 설문 수가 적어 당장 큰 수익은 어렵습니다.
        </p>
      </div>
    </div>
  );
};

export default IntroView;