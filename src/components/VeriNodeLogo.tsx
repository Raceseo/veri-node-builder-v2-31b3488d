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
        {/* 랜딩(IntroView)·가입(Auth)과 같은 문구로 통일.
            tracking-wider·uppercase 제거: 영문 전용 타이포다 — 한글에 자간을 벌리면
            "데 이 터  신 탁  플 랫 폼"이 되어 안 읽힌다. */}
        <span className="text-[10px] text-muted-foreground">
          데이터 신탁 플랫폼
        </span>
      </div>
    </div>
  );
};

export default VeriNodeLogo;