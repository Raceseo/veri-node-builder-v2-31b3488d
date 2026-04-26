import { CheckCircle2 } from "lucide-react";
import { TrustBadge, TrustProgress } from "./atoms";

interface DataValueCardProps {
  name?: string;
  score?: number;
  verifiedSteps?: number;
  totalSteps?: number;
  grade?: string;
  surveyCount?: string;
  paidAmount?: string;
}

export function DataValueCard({
  name = "김○○",
  score = 87,
  verifiedSteps = 4,
  totalSteps = 5,
  grade = "A 등급 · 본인 확인됨",
  surveyCount = "12건",
  paidAmount = "₩60,000",
}: DataValueCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrustBadge size={40} />
          <div>
            <div className="text-[15px] font-bold text-navy">
              {name} 님의 데이터 가치
            </div>
            <div className="text-xs text-muted-foreground">공급자 예시 프로필</div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[26px] font-extrabold tracking-tight text-trust tabular-nums">
            {score}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>

      <TrustProgress value={score} />

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-trustTeal" />
          완료된 인증 <b className="text-navy">{verifiedSteps}/{totalSteps}</b>
        </span>
        <span className="font-semibold text-trust">{grade}</span>
      </div>

      <div className="mt-[18px] grid grid-cols-2 gap-4 border-t border-border pt-[18px]">
        <Stat label="응답 가능 설문" value={surveyCount} />
        <Stat label="누적 지급 금액" value={paidAmount} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-bold tracking-tight tabular-nums text-navy">
        {value}
      </div>
    </div>
  );
}
