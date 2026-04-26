import { ReactNode } from "react";

interface StepCardProps {
  step: number;
  title: string;
  desc: string;
  icon: ReactNode;
  active?: boolean;
}

export function StepCard({ step, title, desc, icon, active = false }: StepCardProps) {
  return (
    <div
      className={`relative rounded-2xl border-2 bg-white px-5 py-6 transition-all ${
        active ? "border-trust shadow-card" : "border-border"
      }`}
    >
      <div className="absolute -top-[11px] left-[18px]">
        <span
          className={`rounded-full px-2.5 py-[3px] text-[10px] font-extrabold uppercase tracking-[0.08em] ${
            active ? "bg-trust text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          Step {step}
        </span>
      </div>
      <div className="mt-1 flex items-start gap-3.5">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
            active
              ? "bg-trust/10 text-trust"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="mb-1 text-[15px] font-bold text-navy">{title}</div>
          <div className="text-[13px] leading-relaxed text-muted-foreground">{desc}</div>
        </div>
      </div>
    </div>
  );
}
