import { ReactNode } from "react";
import { Shield } from "lucide-react";

type Tone = "trust" | "gold" | "teal";

const toneColor: Record<Tone, string> = {
  trust: "text-trust-dark",
  gold: "text-gold-dark",
  teal: "text-trustTeal-dark",
};

export function Pill({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-[5px] text-xs font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

export function TrustBadge({
  size = 40,
  variant = "trust",
}: {
  size?: number;
  variant?: "trust" | "gold" | "secure";
}) {
  const bg =
    variant === "gold"
      ? "bg-gradient-to-br from-gold to-gold-light"
      : variant === "secure"
        ? "bg-gradient-to-br from-navy to-trust"
        : "bg-gradient-to-br from-trust to-trustTeal";
  const shadow =
    variant === "gold"
      ? "shadow-[0_2px_12px_hsl(43_96%_56%/.35)]"
      : "shadow-[0_2px_14px_hsl(217_91%_60%/.3)]";

  return (
    <div
      className={`${bg} ${shadow} grid place-items-center rounded-full`}
      style={{ width: size, height: size }}
    >
      <Shield className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}

export function GovMark({ tone = "trust" }: { tone?: Tone }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <Shield className={`h-3.5 w-3.5 ${toneColor[tone]}`} />
      <span>공공 마이데이터 기반 · 본인 인증</span>
    </span>
  );
}

export function CounterLine({
  count,
  tone = "trust",
}: {
  count: number;
  tone?: Tone;
}) {
  const accentBg =
    tone === "gold" ? "bg-gold-dark" : tone === "teal" ? "bg-trustTeal" : "bg-trust";
  const accentText =
    tone === "gold"
      ? "text-gold-dark"
      : tone === "teal"
        ? "text-trustTeal-dark"
        : "text-trust";

  return (
    <div className="inline-flex items-center gap-2.5 text-[13px] text-muted-foreground">
      <span className="relative inline-block h-2 w-2">
        <span className={`absolute inset-0 rounded-full ${accentBg} animate-pulse-glow`} />
        <span className={`absolute inset-[2px] rounded-full ${accentBg}`} />
      </span>
      이미{" "}
      <b className={`${accentText} tabular-nums`}>{count}</b>
      명이 사전 신청했습니다
    </div>
  );
}

export function TrustProgress({
  value = 47,
  max = 100,
  variant = "trust",
}: {
  value?: number;
  max?: number;
  variant?: "trust" | "gold";
}) {
  const pct = Math.min(100, (value / max) * 100);
  const bg =
    variant === "gold"
      ? "bg-gradient-to-r from-gold to-gold-light"
      : "bg-gradient-to-r from-trust to-trustTeal";

  return (
    <div className="relative h-3 overflow-hidden rounded-full bg-muted">
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-out ${bg}`}
        style={{ width: `${pct}%` }}
      />
      <div
        className={`absolute inset-y-0 left-0 rounded-full opacity-50 blur-[4px] ${bg}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
