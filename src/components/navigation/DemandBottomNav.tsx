import { Store, ShoppingBag, FileBarChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type DemandTabType = "market" | "purchases" | "reports" | "settings";

interface DemandBottomNavProps {
  activeTab: DemandTabType;
  onTabChange: (tab: DemandTabType) => void;
}

const tabs = [
  { id: "market" as const, icon: Store, label: "마켓" },
  { id: "purchases" as const, icon: ShoppingBag, label: "구매내역" },
  { id: "reports" as const, icon: FileBarChart, label: "품질리포트" },
  { id: "settings" as const, icon: Settings, label: "설정" },
];

const DemandBottomNav = ({ activeTab, onTabChange }: DemandBottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
                isActive
                  ? "text-blue-400"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="demand-tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full"
                />
              )}
              <tab.icon className={cn("w-5 h-5", isActive && "text-blue-400")} />
              <span className={cn("text-xs font-medium", isActive && "text-blue-400")}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default DemandBottomNav;
