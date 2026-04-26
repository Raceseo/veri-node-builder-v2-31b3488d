import { ReactNode } from "react";

interface BenefitRowProps {
  icon: ReactNode;
  title: string;
  desc: string;
}

export function BenefitRow({ icon, title, desc }: BenefitRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-trust/10">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="mb-0.5 text-[13.5px] font-bold text-navy">{title}</div>
        <div className="text-[12.5px] leading-[1.55] text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
