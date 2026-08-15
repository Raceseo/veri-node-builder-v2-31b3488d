import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, Plus, Trash2, FileText, Users, Zap, ChevronRight, AlertCircle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import type { SurveyQuestionType } from "@/integrations/supabase/types.survey";
import { MAX_QUESTIONS, getUnitPrice } from "@/lib/surveyPricing";

/** 문항 수 상한 초과 안내. 상한값 자체는 surveyPricing 의 구간표에서 온다. */
const OVER_LIMIT_NOTICE = `${MAX_QUESTIONS}문항 이내로 조정을 권해드립니다`;

/**
 * 접수 가능한 응답자 수 범위. 값은 여기 한 곳에만 두고 안내 문구도 여기서 파생시킨다.
 * 상한 500 근거: 12문항 기준 ₩400,000 — 첫 거래 예상 규모의 16배라 정상 주문을 막지 않는다.
 * 초과는 거절이 아니라 문의 유도.
 */
const MIN_RESPONDENTS = 10;
const MAX_RESPONDENTS = 500;
const EMPTY_RESPONDENTS_NOTICE = "인원을 입력하세요";
const MIN_RESPONDENTS_NOTICE = `최소 ${MIN_RESPONDENTS}명 이상`;
const MAX_RESPONDENTS_NOTICE =
  `현재 최대 ${MAX_RESPONDENTS}명까지 접수 가능합니다. 그 이상은 contact@verinode.kr로 문의해 주세요.`;

/**
 * 유형 목록. 값은 survey_questions.question_type CHECK 허용값과 **글자 그대로** 일치해야 한다.
 * ('multiple_choice' 등 다른 철자는 DB 가 INSERT 를 거부한다.)
 */
const QUESTION_TYPES: { value: SurveyQuestionType; label: string }[] = [
  { value: "single_choice", label: "객관식 — 단일 선택" },
  { value: "multi_choice",  label: "객관식 — 복수 선택" },
  { value: "scale",         label: "5점 척도" },
  { value: "text",          label: "주관식" },
];

/**
 * 「질문 추가」 버튼 — 목록 위·아래 두 곳에 같은 것을 놓는다.
 * 문항이 늘면 상단 버튼이 스크롤 밖으로 나가 매번 맨 위로 올라가야 했다.
 * 핸들러·잠금 조건은 호출부에서 받아 **한 곳에서만** 결정한다(로직 중복 금지).
 */
const AddQuestionButton = ({
  onClick, disabled, full = false,
}: { onClick: () => void; disabled: boolean; full?: boolean }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    className={`border-blue-600 text-blue-600 hover:bg-blue-50 ${full ? "w-full h-11" : ""}`}
  >
    <Plus className="w-4 h-4 mr-1" /> 질문 추가
  </Button>
);

/** 문항 수 상한 안내 배너. 두 버튼 옆에 각각 붙는다(스크롤 위치와 무관하게 보이도록). */
const LimitNotice = () => (
  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
    <p className="text-sm text-amber-700">{OVER_LIMIT_NOTICE}</p>
  </div>
);

/** 보기 입력칸이 필요한 유형. scale·text 는 options 가 빈 배열이다. */
const needsOptions = (type: SurveyQuestionType) =>
  type === "single_choice" || type === "multi_choice";

interface Question {
  id: string;
  text: string;
  type: SurveyQuestionType;
  /** 선택형만 사용. scale·text 는 항상 빈 배열(null 아님). */
  options: string[];
}

interface TemplateConfig {
  categoryId: string;
  categoryName: string;
  templateId: string;
  templateName: string;
  questions: Question[];
  requiredApis: string[];
  targetGrade: number;
}

interface ProjectBuilderViewProps {
  onBack: () => void;
  initialTemplate?: TemplateConfig | null;
}

const newQuestion = (): Question => ({
  id: Date.now().toString(),
  text: "",
  type: "single_choice",
  options: ["", ""],   // 선택형 기본 2칸
});

const ProjectBuilderView = ({ onBack, initialTemplate }: ProjectBuilderViewProps) => {
  const [projectName, setProjectName] = useState(
    initialTemplate ? `${initialTemplate.categoryName} - ${initialTemplate.templateName}` : ""
  );
  const [researchPurpose, setResearchPurpose] = useState("");
  /** 입력 중에는 문자열 그대로 보관한다 — 되돌리면 원하는 값을 칠 수 없다. 검증은 아래 파생값에서. */
  const [targetCountInput, setTargetCountInput] = useState("100");
  const [questions, setQuestions] = useState<Question[]>(
    initialTemplate?.questions?.length
      ? initialTemplate.questions
      : [{ id: "1", text: "", type: "single_choice", options: ["", ""] }]
  );

  const questionCount = questions.length;
  const atLimit = questionCount >= MAX_QUESTIONS;
  const unitPrice = getUnitPrice(questionCount);

  // 인원 검증 — 되돌리지 않고 "지금 값이 유효한가"만 판정한다.
  const targetCount = targetCountInput === "" ? null : Number(targetCountInput);
  const targetError: string | null =
    targetCount === null ? EMPTY_RESPONDENTS_NOTICE
    : targetCount < MIN_RESPONDENTS ? MIN_RESPONDENTS_NOTICE
    : targetCount > MAX_RESPONDENTS ? MAX_RESPONDENTS_NOTICE
    : null;

  const estimatedCost =
    unitPrice === null || targetCount === null || targetError !== null
      ? null
      : targetCount * unitPrice;

  // 새로 추가한 문항으로 스크롤 — 목록 아래 버튼으로 추가했을 때 새 카드가 화면 밖에 생기는 것을 막는다.
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingScrollId) return;
    questionRefs.current[pendingScrollId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    setPendingScrollId(null);
  }, [pendingScrollId]);

  // ── 문항 편집 ──────────────────────────────────────────────────────────────
  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) {
      toast({ title: "문항 수 초과", description: OVER_LIMIT_NOTICE, variant: "destructive" });
      return;
    }
    const q = newQuestion();
    setQuestions([...questions, q]);
    setPendingScrollId(q.id);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  /** 유형 변경 — 선택형이 아니면 options 를 빈 배열로 비운다(DB 실측 형태와 일치). */
  const changeType = (id: string, type: SurveyQuestionType) => {
    setQuestions(questions.map(q => {
      if (q.id !== id) return q;
      return {
        ...q,
        type,
        options: needsOptions(type) ? (q.options.length ? q.options : ["", ""]) : [],
      };
    }));
  };

  const updateOption = (id: string, idx: number, value: string) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, options: q.options.map((o, i) => i === idx ? value : o) } : q
    ));
  };

  const addOption = (id: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, options: [...q.options, ""] } : q));
  };

  const removeOption = (id: string, idx: number) => {
    setQuestions(questions.map(q =>
      q.id === id && q.options.length > 2
        ? { ...q, options: q.options.filter((_, i) => i !== idx) }
        : q
    ));
  };

  // ── 유효성 검사 ────────────────────────────────────────────────────────────
  const isQuestionValid = (q: Question) => {
    if (!q.text.trim()) return false;
    if (needsOptions(q.type)) {
      if (q.options.length < 2) return false;
      if (q.options.some(o => !o.trim())) return false;
    }
    return true;
  };

  const allQuestionsValid = questions.every(isQuestionValid);
  const canSubmit =
    projectName.trim().length > 0 &&
    researchPurpose.trim().length > 0 &&
    questionCount >= 1 &&
    questionCount <= MAX_QUESTIONS &&
    allQuestionsValid &&
    unitPrice !== null &&
    targetError === null;

  // ── 이탈 경고 ──────────────────────────────────────────────────────────────
  // 임시저장이 없으므로 나가면 작성분이 사라진다. 지금은 경고만 한다(저장 기능은 별건).
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const hasUnsavedInput =
    projectName.trim().length > 0 ||
    researchPurpose.trim().length > 0 ||
    questions.some(q => q.text.trim().length > 0 || q.options.some(o => o.trim().length > 0));

  const handleBack = () => {
    if (hasUnsavedInput) {
      setShowLeaveConfirm(true);
      return;
    }
    onBack();
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      toast({ title: "입력 필요", description: "빈 항목을 채워주세요.", variant: "destructive" });
      return;
    }
    // 제출 처리(status='draft' INSERT)는 다음 단계에서 붙인다.
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 bg-white border-b border-slate-200 shadow-sm">
        <button onClick={handleBack} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">프로젝트 의뢰 빌더</h1>
          <p className="text-xs text-slate-500">Project Request Builder</p>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-32">
        {/* ===== 1. 프로젝트 설정 섹션 ===== */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-slate-900">프로젝트 설정</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">프로젝트 명 *</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="예: 2024 MZ세대 소비 트렌드 조사"
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">조사 목적 *</label>
              <Textarea
                value={researchPurpose}
                onChange={(e) => setResearchPurpose(e.target.value)}
                placeholder="본 조사의 목적과 활용 계획을 상세히 기술해주세요."
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">타겟 응답자 수</label>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={targetCountInput}
                  /* 되돌리지 않는다. 숫자 외 문자만 걸러 문자열 그대로 보관 — 빈칸도 허용. */
                  onChange={(e) => setTargetCountInput(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={EMPTY_RESPONDENTS_NOTICE}
                  className={`w-32 focus:border-blue-500 focus:ring-blue-500 ${
                    targetError ? "border-red-400" : "border-slate-300"
                  }`}
                />
                <span className="text-slate-500 text-sm">명</span>
                <div className="flex items-center gap-1 ml-auto text-blue-600 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{MIN_RESPONDENTS}~{MAX_RESPONDENTS}명</span>
                </div>
              </div>
              {targetError && (
                <p className="text-xs text-red-500 mt-1.5">{targetError}</p>
              )}
            </div>
          </div>
        </section>

        {/* ===== 2. 질문 구성 ===== */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">질문 구성</h2>
                <p className="text-xs text-slate-500">{questionCount} / {MAX_QUESTIONS}문항</p>
              </div>
            </div>
            <AddQuestionButton onClick={addQuestion} disabled={atLimit} />
          </div>

          {atLimit && <div className="mb-4"><LimitNotice /></div>}

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                ref={(el) => { questionRefs.current[question.id] = el; }}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  {/* order_no = 화면 표시 순서대로 1부터 연속 */}
                  <span className="text-sm font-medium text-slate-700">질문 {index + 1}</span>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Select
                  value={question.type}
                  onValueChange={(v) => changeType(question.id, v as SurveyQuestionType)}
                >
                  <SelectTrigger className="border-slate-300 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                  placeholder="질문 내용을 입력하세요"
                  className="border-slate-300 bg-white"
                />

                {needsOptions(question.type) ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">보기 (2개 이상)</p>
                    {question.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center">
                          {oIdx + 1}
                        </span>
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(question.id, oIdx, e.target.value)}
                          placeholder={`보기 ${oIdx + 1}`}
                          className="border-slate-300 bg-white"
                        />
                        <button
                          onClick={() => removeOption(question.id, oIdx)}
                          disabled={question.options.length <= 2}
                          className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addOption(question.id)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4 mr-1" /> 보기 추가
                    </Button>
                  </div>
                ) : question.type === "scale" ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <p className="text-sm text-blue-700">
                      1~5점 척도입니다. 보기 입력이 필요하지 않습니다.
                    </p>
                  </div>
                ) : null}

                {!isQuestionValid(question) && (
                  <p className="text-xs text-red-500">
                    {!question.text.trim()
                      ? "질문 내용을 입력해주세요."
                      : "보기를 모두 채워주세요 (2개 이상)."}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 목록 아래 「질문 추가」 — 상단 버튼이 스크롤 밖으로 나가도 여기서 계속 추가할 수 있다. */}
          <div className="mt-4 space-y-3">
            {atLimit && <LimitNotice />}
            <AddQuestionButton onClick={addQuestion} disabled={atLimit} full />
          </div>
        </section>

        {/* ===== 예상 비용 ===== */}
        <section className="bg-slate-900 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">예상 비용</h3>
            <span className="text-xs text-slate-400">{questionCount}문항 기준</span>
          </div>

          {unitPrice === null ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">{OVER_LIMIT_NOTICE}</p>
            </div>
          ) : targetError ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">{targetError}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">응답 수집</span>
                <span className="text-white">₩{unitPrice.toLocaleString()} × {targetCount}명</span>
              </div>
              <div className="border-t border-slate-700 pt-3 flex items-center justify-between">
                <span className="text-white font-medium">예상 비용</span>
                <span className="text-2xl font-bold text-amber-400">
                  ₩{estimatedCost?.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-4">
            단가는 문항 수 구간에 따라 달라집니다. 결제는 후불이며, 결과 확인 후 청구됩니다.
          </p>
        </section>

      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-md mx-auto">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 text-slate-900 shadow-lg disabled:opacity-40"
        >
          제출하기
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-center text-xs text-slate-500 mt-2">
          {unitPrice === null
            ? OVER_LIMIT_NOTICE
            : targetError
              ? targetError
              : `예상 비용 ₩${estimatedCost?.toLocaleString()} · 유효 응답 기준 과금 · 미달 시 채운 만큼만 청구`}
        </p>
      </div>

      {/* 이탈 경고 — 작성분은 저장되지 않는다. */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성 중인 내용이 저장되지 않습니다</AlertDialogTitle>
            <AlertDialogDescription>나가시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 작성</AlertDialogCancel>
            <AlertDialogAction onClick={onBack}>나가기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectBuilderView;
