import { useState, useEffect } from "react";
import { 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Home,
  Shield,
  Brain,
  Fingerprint,
  FileWarning,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import VeriNodeLogo from "@/components/VeriNodeLogo";

interface VerificationResultViewProps {
  type: "success" | "fail";
  score: number;
  onRetry: () => void;
  onGoHome: () => void;
  failReasons?: string[];
}

export default function VerificationResultView({ 
  type, 
  score, 
  onRetry, 
  onGoHome,
  failReasons = []
}: VerificationResultViewProps) {
  const isFail = type === "fail";

  const defaultFailReasons = [
    "응답 일관성 부족 (42%)",
    "입력 속도 이상 패턴 감지",
    "교차 검증 실패 (2/5 항목)"
  ];

  const reasons = failReasons.length > 0 ? failReasons : defaultFailReasons;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <VeriNodeLogo />
        <div className="w-6 h-6" />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 py-6">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isFail ? "bg-destructive/10" : "bg-success/10"
          }`}>
            {isFail ? (
              <XCircle className="w-14 h-14 text-destructive" />
            ) : (
              <Shield className="w-14 h-14 text-success" />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold text-center mb-2 ${
          isFail ? "text-destructive" : "text-success"
        }`}>
          {isFail ? "무결성 검증 실패" : "무결성 검증 성공"}
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          {isFail 
            ? "제출하신 데이터가 신뢰 기준을 충족하지 못했습니다"
            : "제출하신 데이터가 신뢰 기준을 통과했습니다"
          }
        </p>

        {/* Score Card */}
        <Card className={`p-5 mb-6 ${
          isFail 
            ? "bg-destructive/5 border-destructive/30" 
            : "bg-success/5 border-success/30"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">무결성 점수</span>
            <span className={`text-2xl font-bold ${
              isFail ? "text-destructive" : "text-success"
            }`}>
              {score}점
            </span>
          </div>
          <Progress 
            value={score} 
            className={`h-3 ${isFail ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`}
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0</span>
            <span className={isFail ? "text-destructive" : "text-success"}>
              {isFail ? "기준 미달 (70점 이상 필요)" : "기준 충족"}
            </span>
            <span>100</span>
          </div>
        </Card>

        {/* Fail Reasons */}
        {isFail && (
          <Card className="p-5 mb-6 bg-card border-border">
            <div className="flex items-center gap-2 mb-4">
              <FileWarning className="w-5 h-5 text-destructive" />
              <h3 className="font-semibold text-foreground">검증 실패 사유</h3>
            </div>
            <div className="space-y-3">
              {reasons.map((reason, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-destructive/5 rounded-lg"
                >
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{reason}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Warning Message for Fail */}
        {isFail && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  오염 데이터로 분류되어 보상이 지급되지 않았습니다
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  정직하고 일관된 응답으로 다시 시도해주세요. 반복 실패 시 신뢰 등급이 하락할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Summary */}
        <Card className="p-5 bg-muted/30">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            AI 분석 요약
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-background rounded-xl">
              <Fingerprint className={`w-5 h-5 mx-auto mb-1 ${
                isFail ? "text-destructive" : "text-success"
              }`} />
              <p className="text-xs text-muted-foreground">본인 확인</p>
              <p className={`text-sm font-bold ${
                isFail ? "text-destructive" : "text-success"
              }`}>
                {isFail ? "미확인" : "확인됨"}
              </p>
            </div>
            <div className="text-center p-3 bg-background rounded-xl">
              <Brain className={`w-5 h-5 mx-auto mb-1 ${
                score >= 50 ? "text-amber-500" : "text-destructive"
              }`} />
              <p className="text-xs text-muted-foreground">논리 일관성</p>
              <p className={`text-sm font-bold ${
                score >= 50 ? "text-amber-500" : "text-destructive"
              }`}>
                {score >= 50 ? "보통" : "낮음"}
              </p>
            </div>
            <div className="text-center p-3 bg-background rounded-xl">
              <Shield className={`w-5 h-5 mx-auto mb-1 ${
                isFail ? "text-destructive" : "text-success"
              }`} />
              <p className="text-xs text-muted-foreground">신뢰도</p>
              <p className={`text-sm font-bold ${
                isFail ? "text-destructive" : "text-success"
              }`}>
                {isFail ? "낮음" : "높음"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="px-4 pb-8 space-y-3">
        {isFail ? (
          <>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 h-14 text-base font-medium gap-2"
              onClick={onRetry}
            >
              <RefreshCw className="w-5 h-5" />
              다시 시도하기
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-14 text-base font-medium gap-2"
              onClick={onGoHome}
            >
              <Home className="w-5 h-5" />
              홈으로 돌아가기
            </Button>
          </>
        ) : (
          <Button 
            className="w-full bg-success hover:bg-success/90 h-14 text-base font-medium"
            onClick={onGoHome}
          >
            확인
          </Button>
        )}
      </div>
    </div>
  );
}
