import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  key: string;
  label: string;
}

interface VerificationProgressProps {
  steps: Step[];
  currentIndex: number;
}

const VerificationProgress = ({ steps, currentIndex }: VerificationProgressProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                index < currentIndex
                  ? "bg-success text-success-foreground"
                  : index === currentIndex
                  ? "bg-primary text-primary-foreground shadow-glow animate-glow-pulse"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index < currentIndex ? <Check className="w-5 h-5" /> : index + 1}
            </div>
            <span className={cn(
              "text-xs mt-2 text-center hidden sm:block",
              index <= currentIndex ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 mx-2",
              index < currentIndex ? "bg-success" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );
};

export default VerificationProgress;