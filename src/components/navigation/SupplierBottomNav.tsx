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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border max-w-md mx-auto safe-area-pb z-50">
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
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-all duration-300 min-w-[64px] relative",
                isActive
                  ? isHighlight
                    ? "text-white"
                    : "text-primary"
                  /* 비선택 「수익 쌓기」만 따로 뺀 이유: 이 탭에는 bg-gold/20 틴트가
                     깔려 있어(아래 강조 블록) 실제 배경이 흰색이 아니라
                     rgb(254,242,211)이다. 같은 text-muted-foreground 라도
                     흰 배경 4.85:1 → 틴트 위 4.35:1 로 내려가 AA(4.5:1)를 못 넘긴다.
                     회색이 노란 면에 눌려 노랗게 보인다.
                     gold-text 토큰 = 틴트 위 5.01:1. 틴트 농도를 /30 까지 올려도
                     4.75:1 로 버티도록 토큰 값을 정해뒀다(index.css --gold-text).
                     hover 색 변화는 두지 않았다 — 모바일 전용 하단바다. */
                  : isHighlight
                    ? "text-gold-text"
                    : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* 수익 쌓기 탭 특별 강조 */}
              {isHighlight && (
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-md -z-10 transition-all duration-300",
                    isActive 
                      ? "bg-gold shadow-lg shadow-gold/20"
                      : "bg-gold/20"
                  )}
                  layoutId="highlight-bg"
                />
              )}
              
              <motion.div 
                className={cn(
                  "p-1.5 rounded-md transition-all duration-200",
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
