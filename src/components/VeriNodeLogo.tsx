import { Shield } from "lucide-react";
import { BRAND_TAGLINE_SHORT } from "@/lib/brandCopy";

const VeriNodeLogo = () => {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center shadow-md">
        <Shield className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold text-foreground tracking-tight leading-tight">
          VeriNode
        </span>
        {/* 부제 문구는 brandCopy.ts 단일 출처.
            헤더에서는 짧은 쪽(BRAND_TAGLINE_SHORT)을 쓴다 — 390px 에서 전문은
            "…또 받는 / 곳"으로 깨진다. 이유는 brandCopy.ts 주석에 적어뒀다.
            whitespace-nowrap: 폭이 더 좁아져도 줄바꿈 대신 잘리게 둔다.
            tracking-wider·uppercase 제거: 영문 전용 타이포다 — 한글에 자간을 벌리면
            "데 이 터  신 탁  플 랫 폼"처럼 되어 안 읽힌다. */}
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {BRAND_TAGLINE_SHORT}
        </span>
      </div>
    </div>
  );
};

export default VeriNodeLogo;