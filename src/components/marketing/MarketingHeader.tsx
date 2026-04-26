import { Shield } from "lucide-react";

interface MarketingHeaderProps {
  badgeLabel?: string;
}

export function MarketingHeader({ badgeLabel = "사전 런칭" }: MarketingHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white/90 px-6 backdrop-blur md:px-12">
      <div className="flex items-center gap-2.5">
        <Shield className="h-[22px] w-[22px] text-trust" />
        <span className="text-[17px] font-extrabold tracking-tight text-navy">
          VeriNode
        </span>
        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {badgeLabel}
        </span>
      </div>
      <nav className="hidden gap-5 text-[13px] text-foreground sm:flex">
        <a href="#about" className="hover:text-trust">
          서비스
        </a>
        <a href="#how" className="hover:text-trust">
          어떻게 작동하나요
        </a>
        <a href="#faq" className="hover:text-trust">
          FAQ
        </a>
      </nav>
    </header>
  );
}
