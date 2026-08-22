import { Shield } from "lucide-react";
import { BRAND_TAGLINE } from "@/lib/brandCopy";

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
        {/* 부제 문구는 brandCopy.ts 단일 출처 — 랜딩·가입과 같은 값을 쓴다.
            tracking-wider·uppercase 제거: 영문 전용 타이포다 — 한글에 자간을 벌리면
            "데 이 터  신 탁  플 랫 폼"처럼 되어 안 읽힌다. */}
        <span className="text-[10px] text-muted-foreground">
          {BRAND_TAGLINE}
        </span>
      </div>
    </div>
  );
};

export default VeriNodeLogo;