import { Home, Coins, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type SupplierTabType = "home" | "earn" | "wallet" | "settings";

interface SupplierBottomNavProps {
  activeTab: SupplierTabType;
  onTabChange: (tab: SupplierTabType) => void;
}

const tabs = [
  { id: "home" as const, label: "홈", icon: Home },
  { id: "earn" as const, label: "수익 쌓기", icon: Coins, highlight: true },
  { id: "wallet" as const, label: "내 지갑", icon: Wallet },
  { id: "settings" as const, label: "설정", icon: Settings },
];

const SupplierBottomNav = ({ activeTab, onTabChange }: SupplierBottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border max-w-md mx-auto safe-area-pb z-50">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isHighlight = tab.highlight;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 min-w-[64px] relative",
                isActive 
                  ? isHighlight 
                    ? "text-white" 
                    : "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* 수익 쌓기 탭 특별 강조 */}
              {isHighlight && (
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-2xl -z-10 transition-all duration-300",
                    isActive 
                      ? "bg-gradient-to-r from-gold via-gold-light to-gold shadow-lg shadow-gold/30"
                      : "bg-gradient-to-r from-gold/20 to-gold-light/20"
                  )}
                  layoutId="highlight-bg"
                />
              )}
              
              <motion.div 
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive && !isHighlight && "bg-primary/10"
                )}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon className={cn(
                  "w-5 h-5",
                  isHighlight && isActive && "text-navy"
                )} />
              </motion.div>
              <span className={cn(
                "text-[10px] font-semibold",
                isHighlight && isActive && "text-navy"
              )}>
                {tab.label}
              </span>
              
              {/* 강조 표시 도트 */}
              {isHighlight && !isActive && (
                <motion.div 
                  className="absolute -top-0.5 right-3 w-2 h-2 bg-gold rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* 하단 철학 문구 */}
      <div className="text-center pb-1">
        <p className="text-[9px] text-muted-foreground/60 tracking-wide">
          데이터 주인은 나, 무상 제공 금지
        </p>
      </div>
    </nav>
  );
};

export default SupplierBottomNav;
