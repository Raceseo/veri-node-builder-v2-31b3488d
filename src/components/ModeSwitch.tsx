import { useState } from "react";
import { TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppMode = 'earn' | 'insight';

interface ModeSwitchProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const ModeSwitch = ({ mode, onModeChange }: ModeSwitchProps) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-navy rounded-full shadow-md">
      <button
        onClick={() => onModeChange('earn')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
          mode === 'earn'
            ? "bg-gradient-to-r from-trust to-trust-teal text-white shadow-lg"
            : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        )}
      >
        <TrendingUp className="w-4 h-4" />
        <span>Earn</span>
      </button>
      <button
        onClick={() => onModeChange('insight')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
          mode === 'insight'
            ? "bg-gradient-to-r from-trust-teal to-success text-white shadow-lg"
            : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        )}
      >
        <BarChart3 className="w-4 h-4" />
        <span>Insight</span>
      </button>
    </div>
  );
};

export default ModeSwitch;
