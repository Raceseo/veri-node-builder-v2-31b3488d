import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Coins, ShieldCheck, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface SovereigntyDeclarationViewProps {
  onComplete: () => void;
}

const SovereigntyDeclarationView = ({ onComplete }: SovereigntyDeclarationViewProps) => {
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const promises = [
    {
      icon: Lock,
      emoji: "🔒",
      title: "완벽한 통제",
      description: "언제든 데이터를 연결하거나 끊을 수 있습니다.",
      color: "from-blue-400 to-indigo-500",
    },
    {
      icon: Coins,
      emoji: "💰",
      title: "정당한 보상",
      description: "당신의 데이터가 창출하는 가치를 돌려드립니다.",
      color: "from-amber-400 to-orange-500",
    },
    {
      icon: ShieldCheck,
      emoji: "🛡️",
      title: "철저한 보호",
      description: "당신의 허락 없이는 누구도 데이터를 볼 수 없습니다.",
      color: "from-emerald-400 to-teal-500",
    },
  ];

  const handleSign = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsSigned(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0a1628] to-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Data particles flowing inward */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => {
          const angle = (i / 40) * 360;
          const delay = Math.random() * 5;
          const duration = 4 + Math.random() * 3;
          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-indigo-400/40 rounded-full animate-particle-inward"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${angle}deg) translateX(50vw)`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />

      {/* Main headline */}
      <div className="text-center z-10 mb-10 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
          이제 당신의 데이터는
        </h1>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
          당신의 것입니다
        </h1>
      </div>

      {/* Three Promises */}
      <div className="w-full max-w-sm space-y-4 z-10">
        {promises.map((promise, index) => (
          <div
            key={promise.title}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 animate-fade-in"
            style={{ animationDelay: `${0.3 + index * 0.15}s`, animationFillMode: 'both' }}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                promise.color
              )}>
                <span className="text-2xl">{promise.emoji}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-1">{promise.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{promise.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seal & Button Area */}
      <div className="mt-10 z-10 flex flex-col items-center">
        {/* Gold Seal Animation */}
        <div className={cn(
          "relative w-24 h-24 mb-6 transition-all duration-700",
          isSigning && "scale-110",
          isSigned && "scale-100"
        )}>
          {/* Seal background glow */}
          <div className={cn(
            "absolute inset-0 rounded-full transition-all duration-500",
            isSigned 
              ? "bg-amber-400/30 blur-xl scale-150" 
              : "bg-transparent"
          )} />
          
          {/* Seal SVG */}
          <svg 
            viewBox="0 0 100 100" 
            className={cn(
              "w-full h-full transition-all duration-500 drop-shadow-2xl",
              !isSigning && "opacity-30",
              isSigning && !isSigned && "opacity-70 animate-pulse",
              isSigned && "opacity-100"
            )}
          >
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <filter id="sealGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Outer ring with notches */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#goldGradient)" strokeWidth="3" filter="url(#sealGlow)" />
            
            {/* Decorative notches */}
            {[...Array(24)].map((_, i) => {
              const angle = (i / 24) * 360;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 38 * Math.cos(rad);
              const y1 = 50 + 38 * Math.sin(rad);
              const x2 = 50 + 45 * Math.cos(rad);
              const y2 = 50 + 45 * Math.sin(rad);
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#goldGradient)" strokeWidth="2" />
              );
            })}
            
            {/* Inner circle */}
            <circle cx="50" cy="50" r="32" fill="url(#goldGradient)" opacity="0.2" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="url(#goldGradient)" strokeWidth="2" />
            
            {/* Award icon in center */}
            <g transform="translate(35, 32)">
              <Award className="text-amber-400" />
              <path 
                d="M15 0 L18 10 L30 10 L20 18 L24 30 L15 22 L6 30 L10 18 L0 10 L12 10 Z" 
                fill="url(#goldGradient)"
                transform="scale(0.7) translate(5, 2)"
              />
            </g>
            
            {/* VERIFIED text arc */}
            <path id="textArc" d="M 15,50 A 35,35 0 1,1 85,50" fill="none" />
            <text fontSize="7" fill="#fbbf24" fontWeight="bold" letterSpacing="2">
              <textPath href="#textArc" startOffset="15%">
                VERIFIED • SOVEREIGN
              </textPath>
            </text>
          </svg>
          
          {/* Stamp effect overlay */}
          {isSigned && (
            <div className="absolute inset-0 animate-stamp-press">
              <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping" style={{ animationDuration: '1s', animationIterationCount: '1' }} />
            </div>
          )}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleSign}
          disabled={isSigning || isSigned}
          size="xl"
          className={cn(
            "font-semibold shadow-lg transition-all duration-500 animate-fade-in",
            isSigned 
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30"
              : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50"
          )}
          style={{ animationDelay: '0.9s', animationFillMode: 'both' }}
        >
          {isSigned ? (
            <>
              <Award className="w-5 h-5 mr-2" />
              주권이 선언되었습니다
            </>
          ) : isSigning ? (
            "서명 중..."
          ) : (
            "나의 데이터 주권을 행사하겠습니다"
          )}
        </Button>
      </div>

      {/* Bottom subtle text */}
      <p className="absolute bottom-8 text-slate-600 text-xs text-center max-w-xs animate-fade-in" style={{ animationDelay: '1.2s', animationFillMode: 'both' }}>
        이 선언은 당신의 데이터 주권을 보장하는
        <br />
        VeriNode의 약속입니다
      </p>
    </div>
  );
};

export default SovereigntyDeclarationView;
