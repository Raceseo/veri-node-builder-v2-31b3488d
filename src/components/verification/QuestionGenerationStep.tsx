import { Brain, Loader2 } from "lucide-react";

const QuestionGenerationStep = () => {
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-primary rounded-full animate-pulse opacity-30" />
        <div className="relative w-full h-full bg-gradient-primary rounded-full flex items-center justify-center">
          <Brain className="w-12 h-12 text-primary-foreground" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" />
      </div>
      <h3 className="text-xl font-display font-bold text-foreground mb-2">
        AI가 질문을 생성하고 있습니다
      </h3>
      <p className="text-muted-foreground mb-4">
        프로필을 분석하여 맞춤형 검증 질문을 만들고 있어요
      </p>
      <div className="flex items-center justify-center gap-2 text-primary">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Gemini 3 Pro 분석 중...</span>
      </div>
    </div>
  );
};

export default QuestionGenerationStep;