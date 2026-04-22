import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Send, Clock, Loader2, AlertTriangle, Shield, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Question, SurveyResponse } from "@/types/verinode";

interface SmartSurveyStepProps {
  questions: Question[];
  onSubmit: (responses: SurveyResponse[]) => void;
  isLoading: boolean;
  onRequestFollowUp?: (previousAnswer: string, previousQuestion: string) => Promise<Question | null>;
}

const SmartSurveyStep = ({ questions, onSubmit, isLoading, onRequestFollowUp }: SmartSurveyStepProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(""));
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [charCount, setCharCount] = useState(0);
  const [allQuestions, setAllQuestions] = useState<Question[]>(questions);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [showTrustRising, setShowTrustRising] = useState(false);

  const lastInputTime = useRef<number>(Date.now());
  const recentInputLengths = useRef<{ length: number; time: number }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = allQuestions[currentIndex];

  // ── 보안 등급 점수 계산 (기존 로직 100% 유지) ────────────────────
  const securityScore = useMemo(() => {
    const answerLength = answers[currentIndex]?.length || 0;
    const timeElapsed = (Date.now() - startTime) / 1000;
    let score = 30;
    if (answerLength >= 50) score += 20;
    if (answerLength >= 100) score += 10;
    if (timeElapsed >= 10) score += 15;
    if (timeElapsed >= 30) score += 10;
    score += Math.round((currentIndex / Math.max(allQuestions.length, 1)) * 15);
    return Math.min(score, 100);
  }, [answers, currentIndex, startTime, allQuestions.length]);

  const estimatedReward = useMemo(() => Math.round(securityScore * 1.5), [securityScore]);

  const progressPercent = useMemo(() =>
    Math.round(((currentIndex + 1) / allQuestions.length) * 100),
    [currentIndex, allQuestions.length]
  );

  useEffect(() => {
    setStartTime(Date.now());
    setCharCount(0);
    lastInputTime.current = Date.now();
    recentInputLengths.current = [];
    setIsBlocked(false);
    setBlockReason("");
    setShowTrustRising(false);
    textareaRef.current?.focus();
  }, [currentIndex]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(timer);
  }, []);

  // ── 입력 속도 체크 (기존 로직 100% 유지) ────────────────────────
  const checkInputSpeed = useCallback((newLength: number, prevLength: number) => {
    const now = Date.now();
    const addedChars = newLength - prevLength;
    if (addedChars >= 100) {
      const timeDiff = now - lastInputTime.current;
      if (timeDiff < 1000) {
        setIsBlocked(true);
        setBlockReason("데이터 보호를 위해 직접 작성이 필요합니다.");
        toast({
          title: "🔒 데이터 무결성 보호",
          description: "정확한 데이터 가치 측정을 위해 직접 작성해주세요.",
          variant: "destructive",
        });
        return false;
      }
    }
    recentInputLengths.current.push({ length: addedChars, time: now });
    recentInputLengths.current = recentInputLengths.current.filter(
      record => now - record.time < 1000
    );
    const totalInLastSecond = recentInputLengths.current.reduce(
      (sum, record) => sum + record.length, 0
    );
    if (totalInLastSecond >= 150) {
      setIsBlocked(true);
      setBlockReason("데이터 보호를 위해 잠시 후 다시 입력해주세요.");
      setTimeout(() => { setIsBlocked(false); setBlockReason(""); }, 3000);
      return false;
    }
    lastInputTime.current = now;
    return true;
  }, []);

  const handleAnswerChange = (value: string) => {
    const prevLength = answers[currentIndex]?.length || 0;
    const newLength = value.length;
    if (!checkInputSpeed(newLength, prevLength)) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = value;
    setAnswers(newAnswers);
    setCharCount(prev => prev + Math.abs(newLength - prevLength));
    if (newLength >= 10 && prevLength < 10) {
      setShowTrustRising(true);
      setTimeout(() => setShowTrustRising(false), 2000);
    }
    if (newLength >= 50 && prevLength < 50) {
      setShowTrustRising(true);
      setTimeout(() => setShowTrustRising(false), 2000);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText.length >= 100) {
      e.preventDefault();
      setIsBlocked(true);
      setBlockReason("데이터 가치를 높이기 위해 직접 작성해주세요.");
      toast({
        title: "🔒 데이터 무결성 보호",
        description: "직접 작성된 답변만이 높은 데이터 가치를 인정받습니다.",
        variant: "destructive",
      });
      setTimeout(() => { setIsBlocked(false); setBlockReason(""); }, 3000);
    }
  };

  const handleNext = async () => {
    const timeSpent = Date.now() - startTime;
    const typingSpeed = charCount / (timeSpent / 1000);
    const response: SurveyResponse = {
      questionId: currentQuestion.id,
      answer: answers[currentIndex],
      timeSpent,
      typingSpeed,
    };
    const newResponses = [...responses, response];
    setResponses(newResponses);
    if (onRequestFollowUp && (currentIndex === 1 || currentIndex === 3)) {
      setIsGeneratingFollowUp(true);
      try {
        const followUpQuestion = await onRequestFollowUp(answers[currentIndex], currentQuestion.question);
        if (followUpQuestion) {
          const updatedQuestions = [...allQuestions];
          updatedQuestions.splice(currentIndex + 1, 0, followUpQuestion);
          setAllQuestions(updatedQuestions);
          const updatedAnswers = [...answers];
          updatedAnswers.splice(currentIndex + 1, 0, "");
          setAnswers(updatedAnswers);
          toast({ title: "🔍 추가 검증 질문", description: "이전 답변을 기반으로 상세 확인 질문이 추가되었습니다." });
        }
      } catch (error) {
        console.error("Follow-up question generation error:", error);
      } finally {
        setIsGeneratingFollowUp(false);
      }
    }
    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSubmit(newResponses);
    }
  };

  // ── 신뢰 점수 색상 ───────────────────────────────────────────────
  const scoreColor = securityScore >= 70 ? "#22C55E" : securityScore >= 45 ? "#3182F6" : "#F5A623";
  const currentAnswer = answers[currentIndex] || "";
  const answerLength = currentAnswer.length;

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* ── 신뢰 등급 카드 (개선) ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#1e2d45] bg-[#111827] p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#3182F6]" />
            <span className="text-sm font-semibold text-white">데이터 신뢰 등급</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-extrabold" style={{ color: scoreColor }}>
              {securityScore}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
        </div>

        {/* 프로그레스 바 — 점수에 따라 색상 변경 */}
        <div className="h-2 bg-[#0d1626] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${securityScore}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}aa)` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">성실하게 답변할수록 보상이 커집니다</span>
          <span className="font-semibold" style={{ color: scoreColor }}>
            예상 보상: +{estimatedReward} VN
          </span>
        </div>
      </motion.div>

      {/* ── 데이터 무결성 배너 (개선) ────────────────────────────── */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-500/8 rounded-xl border border-blue-500/20">
        <Shield className="w-3.5 h-3.5 text-[#3182F6] flex-shrink-0" />
        <span className="text-xs text-slate-400">
          데이터 무결성 확인 중 · 당신의 데이터 가치를 높이는 보안 단계입니다
        </span>
      </div>

      {/* ── 진행률 헤더 (개선) ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          질문{" "}
          <span className="text-[#3182F6] font-bold">{currentIndex + 1}</span>
          {" "}/ {allQuestions.length}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>데이터 신뢰도 분석 중</span>
        </div>
      </div>

      {/* 씬 프로그레스 바 */}
      <div className="h-0.5 bg-[#1e2d45] rounded-full overflow-hidden -mt-1">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
          style={{ background: "linear-gradient(90deg, #3182F6, #60a5fa)", boxShadow: "0 0 6px rgba(49,130,246,0.4)" }}
        />
      </div>

      {/* ── 질문 카드 (개선) ─────────────────────────────────────── */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-[#1e2d45] bg-[#111827] p-5"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-[#3182F6] font-black text-xs flex-shrink-0">
            Q{currentQuestion?.id}
          </div>
          <p className="text-[15px] font-semibold text-white leading-relaxed flex-1">
            {currentQuestion?.question}
          </p>
        </div>

        {currentQuestion?.type === "trap" && (
          <div className="inline-flex items-center gap-1.5 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
            ⚠️ 이 질문은 특별 지시사항이 포함되어 있을 수 있습니다
          </div>
        )}
        {currentQuestion?.type === "detail_trap" && (
          <div className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
            🔍 이전 답변 기반 상세 검증 질문
          </div>
        )}
      </motion.div>

      {/* ── 입력 영역 (개선) ─────────────────────────────────────── */}
      <div className="space-y-3">

        {/* 차단 경고 */}
        <AnimatePresence>
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 px-3.5 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{blockReason}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 텍스트 입력 */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="경험에 기반한 솔직한 답변을 작성해주세요..."
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            onPaste={handlePaste}
            disabled={isBlocked}
            className={`min-h-[150px] text-[15px] leading-relaxed rounded-xl border-[1.5px] bg-[#0d1626] text-white placeholder:text-slate-600 resize-none transition-all duration-200 focus:ring-2 focus:ring-[#3182F6]/20 ${
              isBlocked
                ? "opacity-50 cursor-not-allowed border-red-500/40"
                : answerLength >= 50
                ? "border-green-500/40 focus:border-green-500"
                : "border-[#1e2d45] focus:border-[#3182F6]"
            }`}
          />

          {/* 신뢰도 상승 애니메이션 */}
          <AnimatePresence>
            {showTrustRising && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: -5 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute top-2 right-3 flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/25 px-3 py-1.5 rounded-full"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#3182F6]" />
                <span className="text-xs font-medium text-[#3182F6]">신뢰도 상승 중</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3182F6]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 입력 통계 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className={answerLength >= 15 ? "text-green-400" : "text-slate-500"}>
              {answerLength}자 입력됨
            </span>
            {answerLength >= 50 && (
              <span className="text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 충분한 답변
              </span>
            )}
          </div>
          <span className="text-slate-500">
            신뢰도 반영률: {Math.min(Math.round(answerLength / 1.5), 100)}%
          </span>
        </div>

        {/* 다음 버튼 (개선) */}
        <Button
          onClick={handleNext}
          disabled={!currentAnswer.trim() || isLoading || isBlocked || isGeneratingFollowUp}
          className="w-full h-13 rounded-xl text-[15px] font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: !currentAnswer.trim() || isLoading || isBlocked || isGeneratingFollowUp
              ? undefined
              : "linear-gradient(135deg, #3182F6, #1a6fd4)",
            boxShadow: !currentAnswer.trim() || isLoading || isBlocked || isGeneratingFollowUp
              ? undefined
              : "0 8px 24px rgba(49,130,246,0.35)",
          }}
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 분석 중...</>
          ) : isGeneratingFollowUp ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 추가 질문 생성 중...</>
          ) : currentIndex < allQuestions.length - 1 ? (
            <>다음 질문 ({progressPercent}% 완료) <Send className="w-4 h-4 ml-2" /></>
          ) : (
            <>제출하기 (보상 확정) <Send className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>

      {/* ── 하단 신뢰 점수 미리보기 (신규 추가) ─────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111827] border border-[#1e2d45] rounded-xl">
        <span className="text-slate-500 text-xs">실시간 신뢰 점수</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ background: i <= Math.ceil(securityScore / 20) ? scoreColor : "#1e2d45" }}
            />
          ))}
        </div>
        <span className="text-xs font-semibold" style={{ color: scoreColor }}>
          {securityScore >= 70 ? "✅ 우수" : securityScore >= 45 ? "⏳ 양호" : "📝 입력중"}
        </span>
      </div>

      {/* ── 하단 보안 철학 문구 (기존 유지) ─────────────────────── */}
      <p className="text-[11px] text-slate-600 text-center leading-relaxed pt-1">
        🔒 VeriNode는 귀하의 입력 패턴 정보를 철저히 암호화하며, 오직 데이터 주인인 귀하의 권리 보호를 위해서만 사용합니다.
      </p>
    </div>
  );
};

export default SmartSurveyStep;
