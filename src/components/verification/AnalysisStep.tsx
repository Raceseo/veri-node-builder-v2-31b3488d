import { Scan, Loader2 } from "lucide-react";

const AnalysisStep = () => {
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-cyber rounded-full animate-pulse opacity-30" />
        <div className="relative w-full h-full bg-gradient-cyber rounded-full flex items-center justify-center">
          <Scan className="w-12 h-12 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-display font-bold text-foreground mb-2">
        무결성 분석 중
      </h3>
      <p className="text-muted-foreground mb-6">
        AI가 3대 기준으로 응답을 분석하고 있습니다
      </p>
      <div className="space-y-3 text-left max-w-xs mx-auto">
        {["일관성 검증", "성실성 분석", "함정 문항 확인"].map((item, i) => (
          <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisStep;