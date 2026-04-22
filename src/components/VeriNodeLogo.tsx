import { Shield } from "lucide-react";

const VeriNodeLogo = () => {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
        <Shield className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold text-foreground tracking-tight leading-tight">
          VeriNode
        </span>
        <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
          Data Trust Platform
        </span>
      </div>
    </div>
  );
};

export default VeriNodeLogo;