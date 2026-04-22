import VeriNodeLogo from "@/components/VeriNodeLogo";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "데이터 주권을 회복하는 중..." }: LoadingScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/30 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Logo with heartbeat animation */}
      <div className="relative mb-8 animate-heartbeat">
        {/* Glow ring */}
        <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-indigo-500/30 to-violet-500/30 blur-xl animate-pulse-glow" />
        
        {/* Logo container */}
        <div className="relative p-6 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-indigo-500/20">
          <VeriNodeLogo />
        </div>
      </div>

      {/* Loading message */}
      <div className="text-center">
        <p className="text-lg font-medium text-white mb-2">{message}</p>
        
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Subtle message */}
      <p className="absolute bottom-8 text-sm text-white/40">
        잠시만 기다려주세요
      </p>
    </div>
  );
};

export default LoadingScreen;
