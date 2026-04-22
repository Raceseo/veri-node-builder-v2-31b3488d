import { useState, useRef, MouseEvent, TouchEvent } from "react";
import { Share2, Award, ShieldCheck, Twitter, Linkedin, Facebook, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TierType = "Bronze" | "Silver" | "Gold" | "Diamond" | "Platinum";

interface DigitalBadgeCardProps {
  userName: string;
  tier: TierType;
  percentile?: number;
  verifiedDate?: string;
}

const tierConfig = {
  Bronze: {
    gradient: "from-amber-700 via-amber-600 to-amber-800",
    hologram: "from-amber-400/20 via-orange-300/30 to-amber-500/20",
    accent: "#CD7F32",
    textColor: "text-amber-100",
    percentile: "Top 50%",
  },
  Silver: {
    gradient: "from-slate-400 via-gray-300 to-slate-500",
    hologram: "from-white/30 via-slate-200/40 to-white/20",
    accent: "#C0C0C0",
    textColor: "text-slate-800",
    percentile: "Top 30%",
  },
  Gold: {
    gradient: "from-yellow-500 via-amber-400 to-yellow-600",
    hologram: "from-yellow-200/40 via-amber-100/50 to-yellow-300/30",
    accent: "#FFD700",
    textColor: "text-yellow-900",
    percentile: "Top 15%",
  },
  Diamond: {
    gradient: "from-cyan-400 via-blue-300 to-indigo-400",
    hologram: "from-cyan-200/50 via-blue-100/60 to-purple-200/40",
    accent: "#B9F2FF",
    textColor: "text-blue-900",
    percentile: "Top 5%",
  },
  Platinum: {
    gradient: "from-slate-300 via-white to-slate-400",
    hologram: "from-purple-200/30 via-pink-100/40 to-cyan-200/30",
    accent: "#E5E4E2",
    textColor: "text-slate-800",
    percentile: "Top 1%",
  },
};

const DigitalBadgeCard = ({ 
  userName, 
  tier, 
  percentile,
  verifiedDate = new Date().toISOString().split('T')[0] 
}: DigitalBadgeCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHologramActive, setIsHologramActive] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const config = tierConfig[tier];
  const displayPercentile = percentile ? `Top ${percentile}%` : config.percentile;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate tilt angles (max 15 degrees)
    const tiltX = (mouseY / (rect.height / 2)) * -15;
    const tiltY = (mouseX / (rect.width / 2)) * 15;
    
    setTilt({ x: tiltX, y: tiltY });
    setIsHologramActive(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const touchX = touch.clientX - centerX;
    const touchY = touch.clientY - centerY;
    
    const tiltX = (touchY / (rect.height / 2)) * -15;
    const tiltY = (touchX / (rect.width / 2)) * 15;
    
    setTilt({ x: tiltX, y: tiltY });
    setIsHologramActive(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHologramActive(false);
  };

  const handleShare = (platform: string) => {
    const shareText = `🏆 VeriNode ${tier} TIER 인증 배지를 획득했습니다! ${displayPercentile}의 신뢰도를 인정받았어요. #VeriNode #DataTrust`;
    const shareUrl = window.location.href;
    
    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
    }
    
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({
      title: "링크가 복사되었습니다",
      description: "SNS에 공유해보세요!",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      ref={cardRef}
      className="relative w-full aspect-[1.6/1] cursor-pointer perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseLeave}
    >
      <div 
        className="relative w-full h-full transition-transform duration-500 transform-style-3d"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped 
            ? "rotateY(180deg)" 
            : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {/* Front of Card */}
        <div 
          className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Base gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
          
          {/* Metallic texture overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 1px,
                rgba(255,255,255,0.1) 1px,
                rgba(255,255,255,0.1) 2px
              )`,
            }}
          />
          
          {/* Dynamic hologram effect based on tilt */}
          <div 
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              isHologramActive ? "opacity-100" : "opacity-30"
            )}
            style={{
              background: isHologramActive 
                ? `linear-gradient(${135 + tilt.y * 2}deg, 
                    rgba(255,0,128,0.3) 0%, 
                    rgba(0,255,255,0.3) 25%, 
                    rgba(255,255,0,0.3) 50%, 
                    rgba(0,128,255,0.3) 75%, 
                    rgba(255,0,255,0.3) 100%)`
                : undefined,
              backgroundSize: '200% 200%',
              animation: isHologramActive ? 'hologramShift 2s ease infinite' : undefined,
            }}
          />
          
          {/* Shine effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isHologramActive
                ? `radial-gradient(
                    circle at ${50 + tilt.y * 2}% ${50 + tilt.x * 2}%, 
                    rgba(255,255,255,0.5) 0%, 
                    transparent 50%
                  )`
                : undefined,
            }}
          />
          
          {/* Holographic rainbow stripe */}
          <div 
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: "linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0080ff, #8000ff, #ff0080, #ff0000)",
              backgroundSize: "200% 100%",
              animation: "rainbow 2s linear infinite",
            }}
          />
          
          {/* Sparkles when active */}
          {isHologramActive && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => (
                <Sparkles
                  key={i}
                  className="absolute w-4 h-4 text-white/60 animate-ping"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 200}ms`,
                    animationDuration: '1.5s',
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Content */}
          <div className="relative h-full p-5 flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Award className={`w-5 h-5 ${config.textColor}`} />
                  <span className={`text-xs font-medium uppercase tracking-widest ${config.textColor} opacity-80`}>
                    VeriNode Certified
                  </span>
                </div>
                <h2 className={`text-2xl font-bold tracking-tight ${config.textColor}`}>
                  {tier.toUpperCase()} TIER
                </h2>
                <p className={`text-sm ${config.textColor} opacity-80`}>
                  {displayPercentile}
                </p>
              </div>
              
              {/* Holographic emblem */}
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300"
                style={{
                  background: `linear-gradient(135deg, ${config.accent}40, ${config.accent}80)`,
                  boxShadow: isHologramActive 
                    ? `0 0 30px ${config.accent}80, 0 0 60px ${config.accent}40`
                    : `0 0 20px ${config.accent}60`,
                  transform: isHologramActive ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <ShieldCheck className={`w-8 h-8 ${config.textColor}`} />
              </div>
            </div>
            
            {/* Bottom Section */}
            <div>
              <p className={`text-lg font-semibold ${config.textColor} mb-1`}>
                {userName}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: `${config.accent}60` }}
                  >
                    <Check className={`w-3 h-3 ${config.textColor}`} />
                  </div>
                  <span className={`text-xs font-medium ${config.textColor} opacity-80`}>
                    VVIP Access Granted
                  </span>
                </div>
                <span className={`text-xs ${config.textColor} opacity-60`}>
                  {verifiedDate}
                </span>
              </div>
            </div>
          </div>
          
          {/* Tap indicator */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-50">
            <span className={`text-[10px] ${config.textColor}`}>Tap to share</span>
          </div>
        </div>
        
        {/* Back of Card */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
          
          {/* Pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, ${config.accent} 1px, transparent 0)`,
              backgroundSize: "20px 20px",
            }}
          />
          
          {/* Content */}
          <div className="relative h-full p-5 flex flex-col items-center justify-center">
            <Share2 className={`w-8 h-8 ${config.textColor} mb-4`} />
            <h3 className={`text-lg font-bold ${config.textColor} mb-1`}>
              배지 공유하기
            </h3>
            <p className={`text-sm ${config.textColor} opacity-70 mb-4 text-center`}>
              나의 인증 배지를 SNS에 자랑해보세요!
            </p>
            
            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="secondary"
                className="w-12 h-12 rounded-full p-0 bg-[#1DA1F2] hover:bg-[#1DA1F2]/80"
                onClick={() => handleShare("twitter")}
              >
                <Twitter className="w-5 h-5 text-white" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="w-12 h-12 rounded-full p-0 bg-[#0A66C2] hover:bg-[#0A66C2]/80"
                onClick={() => handleShare("linkedin")}
              >
                <Linkedin className="w-5 h-5 text-white" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="w-12 h-12 rounded-full p-0 bg-[#1877F2] hover:bg-[#1877F2]/80"
                onClick={() => handleShare("facebook")}
              >
                <Facebook className="w-5 h-5 text-white" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="w-12 h-12 rounded-full p-0"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            <p className={`text-xs ${config.textColor} opacity-50 mt-4`}>
              탭하여 뒤집기
            </p>
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; transform: translateX(-100%); }
          50% { opacity: 0.6; transform: translateX(100%); }
        }
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes hologramShift {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default DigitalBadgeCard;
