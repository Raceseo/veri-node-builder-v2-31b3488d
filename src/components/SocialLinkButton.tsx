import { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialLinkButtonProps {
  name: string;
  icon: ReactNode;
  isConnected: boolean;
  onConnect: () => void;
  color: string;
}

const SocialLinkButton = ({
  name,
  icon,
  isConnected,
  onConnect,
  color,
}: SocialLinkButtonProps) => {
  return (
    <button
      onClick={onConnect}
      className={cn(
        "flex items-center gap-3 w-full p-4 rounded-xl border-2 transition-all duration-200",
        isConnected
          ? "border-success/50 bg-success/5"
          : "border-border bg-card hover:border-primary/30 hover:bg-secondary"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          isConnected ? "bg-success/10" : color
        )}
      >
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          {isConnected ? "연동 완료" : "계정 연동하기"}
        </p>
      </div>
      {isConnected && (
        <CheckCircle2 className="w-5 h-5 text-success" />
      )}
    </button>
  );
};

export default SocialLinkButton;
