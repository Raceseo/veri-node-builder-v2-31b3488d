import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoinAnimationProps {
  isActive: boolean;
  coinCount?: number;
  onComplete?: () => void;
}

interface Coin {
  id: number;
  x: number;
  delay: number;
}

export const CoinAnimation = ({ isActive, coinCount = 8, onComplete }: CoinAnimationProps) => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isActive && !animating) {
      setAnimating(true);
      
      // Generate coins with random positions
      const newCoins: Coin[] = Array.from({ length: coinCount }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60, // Random x position between 20-80%
        delay: i * 80, // Staggered delay
      }));
      
      setCoins(newCoins);

      // Clear coins after animation completes
      setTimeout(() => {
        setCoins([]);
        setAnimating(false);
        onComplete?.();
      }, 1500);
    }
  }, [isActive, coinCount, onComplete, animating]);

  if (coins.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute animate-coin-fly"
          style={{
            left: `${coin.x}%`,
            bottom: 0,
            animationDelay: `${coin.delay}ms`,
          }}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg animate-spin-slow">
              <Coins className="w-5 h-5 text-amber-900" />
            </div>
            {/* Sparkle trail */}
            <div className="absolute inset-0 animate-sparkle">
              <div className="absolute -top-1 left-1/2 w-1 h-1 bg-amber-300 rounded-full" />
              <div className="absolute -bottom-1 right-0 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CoinAnimation;
