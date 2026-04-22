import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Shield, FileQuestion, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { SNSData } from "./SNSLinkageSheet";
import { supabase } from "@/integrations/supabase/client";

interface CrossVerificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentData: {
    fileName: string;
    analysisResult: {
      trustScore: number;
      verdict: string;
      analysis: {
        documentValidity: string;
        completeness: string;
        recommendation: string;
      };
    };
  } | null;
  snsData: SNSData | null;
  onComplete: (result: CrossVerificationResult) => void;
}

export interface CrossVerificationResult {
  isMatch: boolean;
  matchScore: number;
  bonusPoints: number;
  analysis: {
    matchDetails: string;
    discrepancies: string;
    recommendation: string;
  };
  detectedOccupation: string;
  surveys: Survey[];
}

interface Survey {
  id: number;
  question: string;
  options: string[];
}

type VerificationStep = "verifying" | "result" | "survey";

const CrossVerificationSheet = ({ 
  open, 
  onOpenChange, 
  documentData, 
  snsData, 
  onComplete 
}: CrossVerificationSheetProps) => {
  const [step, setStep] = useState<VerificationStep>("verifying");
  const [result, setResult] = useState<CrossVerificationResult | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && documentData && snsData) {
      performCrossVerification();
    }
  }, [open, documentData, snsData]);

  const performCrossVerification = async () => {
    setStep("verifying");
    
    try {
      console.log("Starting cross-verification...");
      
      const { data, error: invokeError } = await supabase.functions.invoke('cross-verify', {
        body: {
          documentData,
          snsData,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || '교차 검증에 실패했습니다.');
      }

      console.log("Cross-verification complete");

      if (data.success && data.data) {
        setResult(data.data);
        setStep("result");
      } else {
        throw new Error(data.error || '검증 결과를 받지 못했습니다.');
      }
    } catch (error) {
      console.error("Cross-verification error:", error);
      toast({
        title: "교차 검증 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
      onOpenChange(false);
    }
  };

  const handleProceedToSurvey = () => {
    setStep("survey");
  };

  const handleSurveyAnswer = (surveyId: number, answer: string) => {
    setSurveyAnswers(prev => ({ ...prev, [surveyId]: answer }));
  };

  const handleComplete = async () => {
    if (!result) return;
    
    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onComplete(result);
    onOpenChange(false);
    
    toast({
      title: "✅ 교차 검증 완료!",
      description: result.isMatch 
        ? `신뢰 점수 +${result.bonusPoints}점이 추가되었습니다.`
        : "추가 확인이 필요합니다.",
    });
  };

  const handleClose = () => {
    setStep("verifying");
    setResult(null);
    setSurveyAnswers({});
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <SheetHeader className="flex flex-row items-center justify-between px-4 py-4 border-b border-border">
          <button onClick={handleClose} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h2 className="text-lg font-bold text-foreground">데이터 교차 검증</h2>
          <div className="w-10" />
        </SheetHeader>

        <div className="p-6 space-y-6 overflow-y-auto h-[calc(90vh-180px)]">
          {/* Step: Verifying */}
          {step === "verifying" && (
            <div className="py-12 text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 relative">
                <Shield className="w-12 h-12 text-primary" />
                <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">AI 교차 검증 중...</h3>
              <p className="text-muted-foreground text-sm mb-4">
                문서 정보와 SNS 프로필을 비교하고 있습니다.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Gemini AI가 분석 중입니다
              </div>
            </div>
          )}

          {/* Step: Result */}
          {step === "result" && result && (
            <>
              <div className="text-center mb-6">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  result.isMatch ? "bg-success/10" : "bg-amber-500/10"
                }`}>
                  {result.isMatch ? (
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  ) : (
                    <XCircle className="w-10 h-10 text-amber-500" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {result.isMatch ? "데이터 일치 확인!" : "추가 확인 필요"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {result.analysis.matchDetails}
                </p>
              </div>

              {/* Score Card */}
              <div className={`rounded-2xl p-5 ${result.isMatch ? "bg-success/10" : "bg-amber-500/10"}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-foreground">일치도 점수</span>
                  <span className={`text-2xl font-bold ${result.isMatch ? "text-success" : "text-amber-500"}`}>
                    {result.matchScore}점
                  </span>
                </div>
                
                {result.isMatch && (
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-success" />
                      <span className="text-sm text-foreground">보너스 신뢰 점수</span>
                    </div>
                    <span className="font-bold text-success">+{result.bonusPoints}점</span>
                  </div>
                )}
              </div>

              {/* Analysis Details */}
              <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-foreground">분석 결과</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">감지된 직업</span>
                    <span className="font-medium text-foreground">{result.detectedOccupation}</span>
                  </div>
                  {!result.isMatch && result.analysis.discrepancies && (
                    <div>
                      <span className="text-muted-foreground">불일치 항목:</span>
                      <p className="text-foreground mt-1">{result.analysis.discrepancies}</p>
                    </div>
                  )}
                  <p className="text-muted-foreground">{result.analysis.recommendation}</p>
                </div>
              </div>

              {/* Survey Preview */}
              {result.surveys && result.surveys.length > 0 && (
                <div className="bg-primary/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileQuestion className="w-5 h-5 text-primary" />
                    <h4 className="font-medium text-foreground">맞춤형 설문</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {result.detectedOccupation}를 위한 {result.surveys.length}개의 맞춤형 설문이 준비되었습니다.
                  </p>
                  <Button
                    onClick={handleProceedToSurvey}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    설문 참여하기
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Step: Survey */}
          {step === "survey" && result && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">맞춤형 설문</h3>
                <p className="text-muted-foreground text-sm">
                  {result.detectedOccupation}를 위한 질문입니다.
                </p>
              </div>

              <div className="space-y-6">
                {result.surveys.map((survey, index) => (
                  <div key={survey.id} className="bg-card rounded-xl p-4 shadow-card">
                    <p className="font-medium text-foreground mb-3">
                      Q{index + 1}. {survey.question}
                    </p>
                    <div className="space-y-2">
                      {survey.options.map((option, optIndex) => (
                        <button
                          key={optIndex}
                          onClick={() => handleSurveyAnswer(survey.id, option)}
                          className={`w-full p-3 rounded-xl text-left text-sm transition-all ${
                            surveyAnswers[survey.id] === option
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary/50 text-foreground hover:bg-secondary"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom Buttons */}
        {step === "result" && !result?.surveys?.length && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <Button
              onClick={handleComplete}
              className="w-full h-14 rounded-xl text-base bg-primary hover:bg-primary/90"
            >
              확인
            </Button>
          </div>
        )}

        {step === "survey" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <Button
              onClick={handleComplete}
              disabled={isSubmitting || Object.keys(surveyAnswers).length < (result?.surveys?.length || 0)}
              className="w-full h-14 rounded-xl text-base bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  제출 중...
                </>
              ) : (
                "설문 제출 및 완료"
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CrossVerificationSheet;
