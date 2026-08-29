import { useState, useRef, useEffect } from "react";
import { 
  Shield, FileSignature, AlertTriangle, CheckCircle, 
  Brain, Eye, Activity, 
  ArrowRight, Loader2, ShieldCheck, Database, Building2, CreditCard,
  Zap, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileContext } from "@/contexts/ProfileContext";
import {
  SURVEY_QUESTION_PUBLIC_COLUMNS,
  type SurveyResponseInsert,
} from "@/integrations/supabase/types.survey";
import { recordConsent } from "@/lib/recordConsent";
import { SURVEY_ETHICS } from "@/lib/consentTexts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * 뒤로가기 링크 — 모든 단계에 같은 모양으로 통일한다.
 * floating: 가운데 정렬 화면(문항 준비·보안 검사)에서는 좌상단에 띄운다.
 *
 * label 은 단계에 따라 다르다 (2026-08-22 정정):
 *   · 답이 없는 단계(서약·문항 준비) → 기본값 "← 돌아가기"
 *   · 답이 있는 단계(응답·교차검증·보안검사) → EXIT_SURVEY_LABEL
 * 종전에는 전 단계가 "← 돌아가기"였다. 그런데 이 버튼은 **설문 전체 종료**라
 * 사용자가 "이전 문항으로"로 오해했다 — 동작과 표현이 어긋나 있었다.
 */
const BackLink = ({
  onClick, floating = false, label = "← 돌아가기",
}: { onClick: () => void; floating?: boolean; label?: string }) => (
  <button
    onClick={onClick}
    /* 라이트 전환(2단계): 다크 배경 기준 색(slate-400 → hover slate-200)이라
       흰 배경에서는 hover 시 오히려 흐려졌다. 밝은 배경 기준으로 뒤집는다. */
    className={`text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors ${
      floating ? "absolute top-6 left-6 z-10" : "mb-8"
    }`}
  >
    {label}
  </button>
);

/** 답을 이미 입력한 단계에서 쓰는 문구.
 *  이 버튼은 "이전 문항으로"가 아니라 **설문 전체 종료**다 — 답이 전부 사라진다.
 *  「돌아가기」로 두면 사용자가 이전 문항 이동으로 오해한다(Ray 지적 2026-08-22).
 *  ※ 이전 문항 이동 기능은 B-49(응답 수정 불가)를 다시 여는 일이라 별건이다. */
const EXIT_SURVEY_LABEL = "← 설문 나가기";

interface AntiCherryPickerSurveyViewProps {
  onBack: () => void;
  onComplete: () => void;
  /** 있으면 "DB 설문 모드": survey_questions 에서 문항을 읽고 survey_responses 에 저장. 없으면 기존 AI 인증 모드. */
  surveyId?: string;
  /** 구간G: 참여 불가(닫힘·없음) 안내 화면의 "수익 쌓기 탭으로" 버튼 목적지. 없으면 onBack 으로 폴백. */
  onGoToEarn?: () => void;
}

type SurveyStep = "ethics_pledge" | "generating_questions" | "survey" | "cross_verify" | "security_scan" | "complete" | "unavailable";

interface SurveyQuestion {
  id: number;
  text: string;
  type?: string;
  targetSource?: string;
  dbId?: string; // DB 설문 모드에서의 survey_questions.id(uuid)
  options?: string[]; // DB 설문 모드 객관식 보기. 배열 순서 = 화면 표시 순서(절대 정렬·셔플 금지)
}

interface SurveyAnswer {
  questionId: number;
  question: string;
  answer: string;
  timeSpent: number;
  typingSpeed: number;
}

interface MouseTrajectory {
  x: number;
  y: number;
  timestamp: number;
}

interface LinkedDataSummary {
  financial: { name: string; type: string }[];
  government: { name: string; type: string }[];
  profile: {
    occupation: string | null;
    interests: string[] | null;
    sns_keywords: string[] | null;
  } | null;
  transactionCategories: string[];
}

const AntiCherryPickerSurveyView = ({ onBack, onComplete, surveyId, onGoToEarn }: AntiCherryPickerSurveyViewProps) => {
  const queryClient = useQueryClient();
  const { refetch: refetchProfile } = useProfileContext();
  const [currentStep, setCurrentStep] = useState<SurveyStep>("ethics_pledge");
  const [pledgeAgreed, setPledgeAgreed] = useState(false); // 이름 입력칸(형식적·저장 0건) 대체: 명시적 동의 체크박스
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]); // multi_choice 선택 텍스트들(저장 시 JSON.stringify)
  const [crossVerifyIndex, setCrossVerifyIndex] = useState(0);
  const [crossVerifyAnswers, setCrossVerifyAnswers] = useState<string[]>([]);
  // 2026-08-29 — scanProgress(가짜 진행률)·scanStage(연출 문구 순환) 제거.
  //   대신 "지금 실제로 실행 중인 것"만 담는다. 화면 문구와 1:1 대응한다.
  const [scanPhase, setScanPhase] = useState<"saving" | "claiming">("saving");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const [linkedData, setLinkedData] = useState<LinkedDataSummary | null>(null);
  const [isLoadingLinkedData, setIsLoadingLinkedData] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [rewardVn, setRewardVn] = useState<number | null>(null); // DB 설문 모드: surveys.reward_vn 실제 보상값
  // C-3: 보상 적립의 실제 결과. complete 화면 문구/버튼이 이 값을 읽어 분기(표시용 배선만 — 적립·잔액 로직 무변경).
  const [claimOutcome, setClaimOutcome] = useState<"success" | "already" | "failed" | null>(null);
  const [claimFailMsg, setClaimFailMsg] = useState<string | null>(null); // B-55: 보상 실패 사유 문구

  // 이탈 경고 — 응답은 100% 도달 시 1회만 저장된다. 그전에 나가면 전부 사라지고 보상도 없다.
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const hasAnswerProgress =
    answers.length > 0 || currentAnswer.trim().length > 0 || selectedMulti.length > 0;
  const handleSurveyBack = () => {
    if (hasAnswerProgress) {
      setShowExitConfirm(true);
      return;
    }
    onBack();
  };
  /** 응답 진행 중인 단계 3곳에서 같은 것을 쓴다(정의는 여기 한 곳). */
  const exitConfirmDialog = (
    <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>지금 나가면 작성한 답변이 저장되지 않고 보상도 지급되지 않습니다</AlertDialogTitle>
          <AlertDialogDescription>나가시겠습니까?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>계속 응답</AlertDialogCancel>
          <AlertDialogAction onClick={onBack}>나가기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [charCount, setCharCount] = useState(0);
  const mouseTrajectory = useRef<MouseTrajectory[]>([]);
  const lastInputTime = useRef<number>(Date.now());
  const isSavingRef = useRef(false); // 설문 응답 중복 저장 방지(제출 중/완료 시 재호출 차단)
  const submitStartedRef = useRef(false); // security_scan 제출 시퀀스 1회 실행 보장(StrictMode 대비)

  // ✅ DB 설문 모드: surveyId 가 있으면 survey_questions 에서 문항을 읽어온다.
  const isDbSurveyMode = !!surveyId;

  // ✅ 마이데이터 연동 여부 판단 (DB 설문 모드에서는 자동완성 분기를 끔)
  const isFullyLinked =
    !isDbSurveyMode &&
    ((linkedData?.financial?.length ?? 0) > 0 ||
      (linkedData?.government?.length ?? 0) > 0);

  const fetchLinkedData = async (userId: string): Promise<LinkedDataSummary> => {
    const [mydataRes, govdataRes, profileRes, transactionsRes] = await Promise.all([
      supabase.from('mydata_connections').select('institution_name, institution_type').eq('user_id', userId).eq('is_connected', true),
      supabase.from('gov_data_connections').select('agency_name, agency_type').eq('user_id', userId).eq('is_connected', true),
      supabase.from('profiles').select('occupation, interests, sns_keywords').eq('id', userId).single(),
      supabase.from('mydata_transactions').select('category').eq('user_id', userId).limit(50)
    ]);
    const categoryCount: Record<string, number> = {};
    transactionsRes.data?.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
    return {
      financial: mydataRes.data?.map(c => ({ name: c.institution_name, type: c.institution_type })) || [],
      government: govdataRes.data?.map(c => ({ name: c.agency_name, type: c.agency_type })) || [],
      profile: profileRes.data,
      transactionCategories: topCategories
    };
  };

  const generateContextualQuestions = async (data: LinkedDataSummary): Promise<SurveyQuestion[]> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) throw new Error("인증이 필요합니다");
      const response = await supabase.functions.invoke('verinode-ai', {
        body: { action: 'generate_contextual_questions', linkedData: data }
      });
      if (response.error) throw new Error(response.error.message);
      const result = response.data;
      if (result.success && result.data?.questions) {
        return result.data.questions.map((q: { id: number; question: string; type?: string; targetSource?: string }) => ({
          id: q.id, text: q.question, type: q.type, targetSource: q.targetSource
        }));
      }
      throw new Error("질문 생성 실패");
    } catch (error) {
      console.error("Question generation error:", error);
      return getDefaultQuestions(data);
    }
  };

  // ✅ DB 설문 모드: survey_questions 에서 문항 조회 (is_trap 미노출 — 안전 컬럼만 select)
  const fetchDbQuestions = async (sid: string): Promise<SurveyQuestion[]> => {
    // types.ts(생성본)에 surveys/survey_questions 가 아직 없어 캐스팅 필요.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data, error } = await sb
      .from("survey_questions")
      .select(SURVEY_QUESTION_PUBLIC_COLUMNS)
      .eq("survey_id", sid)
      .order("order_no", { ascending: true });
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      id: row.order_no,
      text: row.question_text,
      type: row.question_type,
      dbId: row.id,
      // 조건1: options 배열을 그대로(순서 유지) 보관. 정렬·셔플·필터 없음. 문자열 배열이 아니면 빈 배열로 안전 처리.
      options: Array.isArray(row.options) ? (row.options as string[]) : [],
    }));
  };

  const getDefaultQuestions = (data: LinkedDataSummary): SurveyQuestion[] => {
    const questions: SurveyQuestion[] = [];
    let id = 1;
    if (data.financial.length > 0) {
      const inst = data.financial[0];
      questions.push({ id: id++, text: `${inst.name}에서 가장 자주 사용하는 서비스나 기능은 무엇인가요?`, type: "financial", targetSource: inst.name });
    }
    if (data.government.length > 0) {
      const agency = data.government[0];
      questions.push({ id: id++, text: `${agency.name}에서 최근 조회하거나 이용한 서비스는 무엇인가요?`, type: "government", targetSource: agency.name });
    }
    if (data.transactionCategories.length > 0) {
      questions.push({ id: id++, text: `'${data.transactionCategories[0]}' 항목에서 가장 자주 이용하는 업체나 브랜드는?`, type: "transaction", targetSource: data.transactionCategories[0] });
    }
    if (data.profile?.occupation) {
      questions.push({ id: id++, text: `${data.profile.occupation}으로서 업무에 가장 많이 사용하는 도구나 서비스는?`, type: "profile", targetSource: "직업" });
    }
    while (questions.length < 4) {
      questions.push({ id: id++, text: "현재 가장 자주 사용하는 모바일 앱 3가지와 그 이유를 알려주세요.", type: "general" });
    }
    questions.push({ id: id, text: "위에서 답변한 내용 중 하나를 선택해서, 그 서비스를 처음 사용하게 된 계기와 시기를 구체적으로 알려주세요.", type: "trap", targetSource: "교차검증" });
    return questions.slice(0, 5);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseTrajectory.current.push({ x: e.clientX, y: e.clientY, timestamp: Date.now() });
      if (mouseTrajectory.current.length > 100) mouseTrajectory.current.shift();
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const loadLinkedData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setIsLoadingLinkedData(true);
      try {
        const data = await fetchLinkedData(user.id);
        setLinkedData(data);
      } catch (error) {
        console.error("Failed to load linked data:", error);
      } finally {
        setIsLoadingLinkedData(false);
      }
    };
    loadLinkedData();
  }, []);

  useEffect(() => {
    if (currentStep !== "generating_questions") return;

    // ✅ DB 설문 모드: survey_questions 에서 문항 로드 후 곧바로 survey 단계로
    if (isDbSurveyMode && surveyId) {
      let cancelled = false;
      setGenerationStage("설문 문항 불러오는 중...");
      setGenerationProgress(30);
      Promise.all([
        fetchDbQuestions(surveyId),
        // 보상 문구 실값 표시용 reward_vn 동시 조회. eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("surveys").select("reward_vn").eq("id", surveyId).single(),
      ])
        .then(([questions, rewardRes]) => {
          if (cancelled) return;
          setGenerationProgress(100);
          // 구간G: closed/없는 설문은 RLS 로 문항 0건 + surveys 행 없음(.single() 406)으로 나타난다.
          //   (closed 와 없음은 RLS 상 클라이언트가 구분 불가.) 빈 설문으로 survey 단계에 들어가면
          //   폴백 스피너에 무한히 갇히므로, 이용불가 안내 화면으로 분기한다.
          if (questions.length === 0 || rewardRes?.data == null) {
            setCurrentStep("unavailable");
            return;
          }
          setSurveyQuestions(questions);
          setRewardVn(rewardRes?.data?.reward_vn ?? null);
          setCurrentStep("survey");
          setQuestionStartTime(Date.now());
        })
        .catch((e) => {
          if (cancelled) return;
          console.error("DB 설문 문항 로드 실패:", e);
          toast({ title: "설문을 불러오지 못했습니다", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
          onBack();
        });
      return () => { cancelled = true; };
    }

    if (linkedData) {
      const stages = [
        "연동 데이터 분석 중...", "금융 정보 기반 질문 생성 중...",
        "정부 데이터 기반 질문 생성 중...", "거래 패턴 분석 중...", "맞춤형 질문 최종 검토 중..."
      ];
      let progress = 0;
      let stageIndex = 0;
      const progressInterval = setInterval(() => {
        progress += 2;
        setGenerationProgress(Math.min(progress, 95));
        if (progress % 20 === 0 && stageIndex < stages.length - 1) {
          stageIndex++;
          setGenerationStage(stages[stageIndex]);
        }
      }, 100);
      setGenerationStage(stages[0]);

      // ✅ 연동 데이터가 있으면 → 자동 완성 후 바로 security_scan으로
      if (isFullyLinked) {
        const autoAnswers: SurveyAnswer[] = (linkedData.financial.length > 0
          ? linkedData.financial
          : linkedData.government
        ).map((item, idx) => ({
          questionId: idx + 1,
          question: `${item.name} 연동 데이터`,
          answer: `[마이데이터 자동 완성] ${item.name} (${item.type})`,
          timeSpent: 3000,
          typingSpeed: 0,
        }));
        setAnswers(autoAnswers);

        setTimeout(() => {
          clearInterval(progressInterval);
          setGenerationProgress(100);
          setGenerationStage("✅ 연동 데이터 자동 완성 완료!");
          setTimeout(() => setCurrentStep("security_scan"), 800);
        }, 2000);
        return () => clearInterval(progressInterval);
      }

      // 연동 없으면 → 기존 AI 질문 생성
      generateContextualQuestions(linkedData).then((questions) => {
        clearInterval(progressInterval);
        setGenerationProgress(100);
        setSurveyQuestions(questions);
        setTimeout(() => { setCurrentStep("survey"); setQuestionStartTime(Date.now()); }, 500);
      }).catch(() => {
        clearInterval(progressInterval);
        toast({ title: "질문 생성 실패", description: "기본 질문으로 진행합니다.", variant: "destructive" });
        setSurveyQuestions(getDefaultQuestions(linkedData));
        setCurrentStep("survey");
        setQuestionStartTime(Date.now());
      });
      return () => clearInterval(progressInterval);
    }
  }, [currentStep, linkedData, isDbSurveyMode, surveyId]);

  /**
   * B-29 1단계: 인증 확정·기록·보상을 Edge Function(claim-verification-reward)으로 이관.
   *
   *  · 이전에는 프론트가 profiles 를 직접 UPDATE 하고 verification_history 에 INSERT 했다.
   *    그 INSERT 는 서울 실물 정책이 service_role 전용이라 **넉 달간 한 번도 성공하지 못했다**
   *    (테이블 전체 0행). VN 보상도 보안 규칙 #4 때문에 미지급 상태였다.
   *  · 이제 is_verified·trust_score·verification_history·vn_balance·transactions 를
   *    grant_verification_reward RPC 가 **한 트랜잭션**으로 처리한다. 하나라도 실패하면
   *    전체 롤백되므로 "점수만 오르고 기록은 없는" 상태가 구조적으로 생기지 않는다.
   *  · 중복 지급은 서버가 막는다(is_verified 확인 + UNIQUE(user_id)). 프론트는 판단하지 않는다.
   *
   * B-30 (가) 차단: 성공(true)일 때만 호출부가 완료 화면으로 넘어간다.
   *   실패했는데 "인증 완료"라고 말하면 사용자는 점수가 오른 줄 알고 떠난다.
   *   이전 (나) 알림("인증은 완료됐지만 기록을 저장하지 못했습니다")은 여기서 사라진다 —
   *   기록이 실패하면 인증 자체가 롤백되므로 그런 중간 상태가 없다.
   *
   * B-33: use-toast 의 TOAST_LIMIT = 1 이라 같은 틱에 toast() 를 두 번 부르면 먼저 것이
   *   그려지기도 전에 잘린다. → 분기당 정확히 토스트 1개.
   */
  const updateProfileVerification = async (): Promise<boolean> => {
    setIsUpdatingProfile(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-verification-reward");

      if (error) {
        console.error("claim-verification-reward 호출 실패:", error);
        toast({
          title: "인증을 완료하지 못했습니다",
          description: "다시 시도해 주세요. 점수는 아직 반영되지 않았습니다.",
          variant: "destructive",
        });
        return false;
      }

      // 잔액·기록·거래 UI 갱신 (성공/이미완료 공통)
      const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["home-profile"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      };

      // 이미 인증됐거나 이미 적립된 계정 — 실패가 아니므로 완료 화면으로 진행한다.
      if (data?.already_claimed) {
        refresh();
        toast({ title: "이미 인증이 완료된 계정입니다" });
        return true;
      }

      if (!data?.success) {
        console.error("claim-verification-reward 응답 이상:", data);
        toast({
          title: "인증을 완료하지 못했습니다",
          description: "다시 시도해 주세요. 점수는 아직 반영되지 않았습니다.",
          variant: "destructive",
        });
        return false;
      }

      refresh();
      toast({
        title: `🎉 인증 완료 · +${(data.reward_vn ?? 0).toLocaleString()} VN 적립`,
        description: `신뢰도 +${data.score_change ?? 0}점 · 현재 잔액 ${(data.new_balance ?? 0).toLocaleString()} VN`,
      });
      return true;
    } catch (error) {
      console.error("Verification update error:", error);
      toast({
        title: "인증을 완료하지 못했습니다",
        description: "다시 시도해 주세요. 점수는 아직 반영되지 않았습니다.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // ✅ DB 설문 모드: 응답을 survey_responses 에 저장 (VN 적립 없음 — 구간④에서 Edge Function으로 별도 처리)
  const saveSurveyResponses = async () => {
    if (!surveyId) return;
    // 멱등 가드: 이미 저장이 진행/완료됐으면 재실행하지 않음(StrictMode 이중 발화·이벤트 중복 대비)
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      // ✅ 요청에 실제로 실리는 세션(JWT)의 유저를 user_id 로 사용 → RLS(auth.uid() = user_id) 통과 보장.
      //    세션이 없으면(만료/미로그인) 저장을 시도하지 않고 명시적으로 중단한다.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        console.error("설문 응답 저장 중단: 유효한 세션 없음", sessionError);
        toast({ title: "로그인이 필요합니다", description: "세션이 만료되었어요. 다시 로그인 후 시도해주세요.", variant: "destructive" });
        isSavingRef.current = false; // 세션 없음 → 재시도 허용
        return;
      }
      const uid = session.user.id;

      const rows: SurveyResponseInsert[] = answers.map((a) => {
        const q = surveyQuestions.find((sq) => sq.id === a.questionId);
        return {
          user_id: uid,               // 세션 uid (= auth.uid())
          survey_id: surveyId,
          survey_question_id: q?.dbId ?? null,
          question_id: a.questionId, // order_no 저장(question_id 는 INTEGER)
          question_text: a.question,
          answer: a.answer,
          time_spent: a.timeSpent,
          typing_speed: a.typingSpeed,
          verification_id: null,     // 설문 모드는 verification_history 와 무관
        };
      });
      // types.ts(생성본)에 survey_id/survey_question_id 컬럼이 아직 없어 캐스팅 필요.
      const { error } = await supabase.from("survey_responses").insert(rows as never);
      if (error) {
        // 42501 재발 시 hint/details 로 원인 좁히기
        console.error("설문 응답 저장 실패:", {
          code: error.code, message: error.message,
          details: error.details, hint: error.hint, payloadUserId: uid,
        });
        toast({ title: "응답 저장 실패", description: error.message, variant: "destructive" });
        isSavingRef.current = false; // 실패 → 재시도 허용
        return;
      }
      // 성공 시 isSavingRef 는 true 로 유지 → 이후 재호출로 인한 중복 저장 방지
      toast({ title: "✅ 응답이 제출되었습니다", description: `${rows.length}개 응답 저장 완료` });
    } catch (e) {
      console.error("설문 응답 저장 오류:", e);
      isSavingRef.current = false; // 예외 → 재시도 허용
    }
  };

  // ✅ DB 설문 모드: 응답 저장 성공 후 보상 적립(Edge Function 경유 — service_role 로 vn_balance 변경).
  //    중복/위조/응답실재는 모두 서버(claim-survey-reward)에서 검증한다.
  const claimSurveyReward = async () => {
    if (!surveyId) return;
    // B-55: 보상 실패 사유(code)별 정직한 안내. code 미상·파싱 실패는 반드시 불명 문구로 폴백.
    const failMessage = (code?: string | null): string => {
      switch (code) {
        case "incomplete_survey": return "모든 문항에 답해야 보상이 지급됩니다";
        case "too_fast":          return "응답이 너무 빠르게 완료되었습니다. 문항을 확인하고 다시 응답해 주세요";
        default:                  return "보상 적립에 실패했습니다. 잠시 후 다시 시도해 주세요";
      }
    };
    try {
      const { data, error } = await supabase.functions.invoke("claim-survey-reward", {
        body: { surveyId },
      });
      if (error) {
        // 실패 사유 code 는 비-2xx 응답 본문에 있음 → error.context(Response) 파싱. 실패 시 code=null.
        let code: string | null = null;
        try { code = (await (error as any).context?.json())?.code ?? null; } catch { code = null; }
        const msg = failMessage(code);
        console.error("보상 적립 실패:", { code });
        setClaimOutcome("failed"); // C-3: 실패 결과 기록(화면 표시용)
        setClaimFailMsg(msg);      // B-55: 화면·토스트 공통 사유 문구
        toast({ title: "보상 적립 실패", description: msg, variant: "destructive" });
        return;
      }
      if (data?.already_claimed) {
        setClaimOutcome("already"); // C-3: 이미 지급 결과 기록
        toast({ title: "이미 보상을 받은 설문입니다" });
      } else if (data?.success) {
        setClaimOutcome("success"); // C-3: 성공 결과 기록
        if (typeof data.reward_vn === "number") setRewardVn(data.reward_vn);
        toast({ title: `🎉 +${(data.reward_vn ?? 0).toLocaleString()} VN 적립 완료`, description: `현재 잔액 ${(data.new_balance ?? 0).toLocaleString()} VN` });
      }
      // 잔액/거래 UI 갱신
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["home-profile"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // 조건②(경미 건): Realtime 반영이 지연될 수 있어, 프로필 쿼리를 명시적으로 강제 재조회.
      //   화면 잔액이 새로고침 없이 갱신되는지는 브라우저 실측으로 확인 필요.
      refetchProfile();
      // 목록의 "참여 완료" 배지도 즉시 반영되도록 active-surveys 무효화
      queryClient.invalidateQueries({ queryKey: ["active-surveys"] });
    } catch (e) {
      console.error("보상 적립 오류:", e);
      setClaimOutcome("failed");          // C-3: 예외도 실패로 기록(무응답 blank 방지)
      setClaimFailMsg(failMessage(null)); // B-55: 응답 없음(예외) → 불명 문구로 폴백
    }
  };

  // 2026-08-29 — 제출 직후 화면에서 **가짜 대기 10초를 제거**했다.
  //
  //   전에는 진행률이 setInterval 로 0→100 까지 10.0초(0.5 × 200회 × 50ms) 올라가고,
  //   **100% 에 닿은 뒤에야** saveSurveyResponses()/claimSurveyReward() 가 시작했다.
  //   즉 그 10초는 서버를 기다리는 시간이 아니라 **저장을 미루는 시간**이었고,
  //   그동안 화면은 "타이핑 패턴 분석 중"·"행동 패턴 이상 탐지 중"이라고 말했다.
  //   응답자를 의심하는 표현인데다 그 분석은 그 시점에 실행되지도 않았다.
  //
  //   ⚠️ grant_survey_reward 의 최소 응답시간 30,000ms 판정과는 **무관하다.**
  //     timeSpent 는 문항 제출 시점(handleNextQuestion)에 계산·확정되어 answers 에 담기고,
  //     saveSurveyResponses 는 그 값을 옮길 뿐이다(내부에 Date.now() 호출 0건).
  //     이 화면이 몇 초를 머무르든 문턱은 달라지지 않는다.
  //
  //   최소 표시 0.8초는 **깜빡임 방지 한정**이다. 저장이 즉시 끝나면 화면이 번쩍하고
  //   지나가므로 그것만 막는다 — 그 이상의 지연 연출은 두지 않는다.
  useEffect(() => {
    if (currentStep !== "security_scan") return;
    // StrictMode 이중 발화 가드. 즉시 실행으로 바뀌어 두 마운트가 겹칠 수 있다.
    //   saveSurveyResponses 는 isSavingRef 로 막히지만 조기 return 후 .then 이 이어져
    //   claimSurveyReward 가 두 번 불릴 수 있으므로 시퀀스 전체를 한 번만 태운다.
    if (submitStartedRef.current) return;
    submitStartedRef.current = true;

    const startedAt = Date.now();
    const holdMinimum = () => {
      const remain = 800 - (Date.now() - startedAt);
      return remain > 0 ? new Promise<void>(r => setTimeout(r, remain)) : Promise.resolve();
    };

    if (isDbSurveyMode) {
      // B-1: 응답 저장 성공 직후 별도로 보상 적립(Edge Function). 적립이 실패해도 응답은 남는다.
      saveSurveyResponses()
        .then(() => { setScanPhase("claiming"); return claimSurveyReward(); })
        .then(holdMinimum)
        .then(() => setCurrentStep("complete"));
    } else {
      // B-30 (가) 차단: 실패하면 완료 화면으로 넘어가지 않는다.
      updateProfileVerification()
        .then(async (ok) => { await holdMinimum(); if (ok) setCurrentStep("complete"); });
    }
  }, [currentStep, isDbSurveyMode]);

  const handlePledgeSubmit = async () => {
    if (!pledgeAgreed) {
      toast({ title: "확인이 필요합니다", description: "위 내용을 확인하고 체크해주세요.", variant: "destructive" });
      return;
    }
    // J-1(변경1): 설문 서약 동의를 매번 기록(설문마다 서약을 받으므로). 실패 시 진행 차단.
    const { ok } = await recordConsent({
      consentType: SURVEY_ETHICS.consentType,
      consentVersion: SURVEY_ETHICS.version,
    });
    if (!ok) {
      toast({
        title: "동의를 저장하지 못했습니다",
        description: "다시 시도해 주세요. 동의가 저장되어야 설문에 참여할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep("generating_questions");
  };

  const handleAnswerChange = (value: string) => {
    const now = Date.now();
    const addedChars = value.length - currentAnswer.length;
    if (addedChars >= 100 && now - lastInputTime.current < 1000) {
      toast({ title: "⚠️ 비정상 입력 감지", description: "복사-붙여넣기가 감지되었습니다.", variant: "destructive" });
      return;
    }
    lastInputTime.current = now;
    setCharCount(prev => prev + Math.abs(addedChars));
    setCurrentAnswer(value);
  };

  const handleNextQuestion = () => {
    const q = surveyQuestions[currentQuestionIndex];
    const hasOptions = (q.options?.length ?? 0) > 0;
    // 결정B: multi_choice 만 선택 텍스트 배열을 JSON.stringify 로 저장.
    //        single_choice/text 는 문자열 그대로, scale 은 "1"~"5" 문자열 그대로.
    const isMulti = q.type === "multi_choice" && hasOptions;
    const answerValue = isMulti ? JSON.stringify(selectedMulti) : currentAnswer;
    const timeSpent = Date.now() - questionStartTime;
    const typingSpeed = charCount / (timeSpent / 1000);
    setAnswers(prev => [...prev, {
      questionId: q.id,
      question: q.text,
      answer: answerValue, timeSpent, typingSpeed,
    }]);
    setCurrentAnswer(""); setSelectedMulti([]); setCharCount(0); setQuestionStartTime(Date.now());
    if (currentQuestionIndex < surveyQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // 구간③-C: DB 설문 모드는 cross_verify(자유서술 강제)를 생략하고 security_scan 직행.
      //   인증 모드(getDefaultQuestions 경로)는 기존대로 cross_verify 유지.
      setCurrentStep(isDbSurveyMode ? "security_scan" : "cross_verify");
    }
  };

  const handleCrossVerifyAnswer = (answer: string) => {
    setCrossVerifyAnswers(prev => [...prev, answer]);
    if (crossVerifyIndex < answers.length - 1) {
      setCrossVerifyIndex(prev => prev + 1);
    } else {
      setCurrentStep("security_scan");
    }
  };

  const linkedDataCount = {
    financial: linkedData?.financial.length || 0,
    government: linkedData?.government.length || 0,
    hasSns: !!(linkedData?.profile?.sns_keywords && linkedData.profile.sns_keywords.length > 0),
    hasProfile: !!(linkedData?.profile?.occupation || linkedData?.profile?.interests?.length)
  };

  // ─── STEP 1: Ethics Pledge ────────────────────────────────────────────────
  if (currentStep === "ethics_pledge") {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-lg mx-auto">
          <BackLink onClick={onBack} />
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center border-2 border-blue-200">
              <FileSignature className="w-10 h-10 text-blue-100" />
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">데이터 윤리 서약</h1>
            <p className="text-slate-500 text-sm">설문 참여 전, 정직한 응답을 약속해주세요</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-6 mb-6">
            <div className="border-b border-slate-200 pb-4 mb-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                <span className="text-blue-600 font-semibold">솔직한 답변</span>이 이 데이터의 값을 만듭니다. 아래를 확인하고 시작해 주세요.
              </p>
            </div>
            <div className="space-y-3 mb-6">
              {SURVEY_ETHICS.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span className="text-slate-600 text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* ✅ 연동 데이터 요약 + 자동완성 안내
                구간F-1(E): DB 설문 모드는 마이데이터 자동완성을 쓰지 않으므로 이 박스(헤더 포함) 전체를 숨김.
                헤더 "연동 데이터 기반 설문이 생성됩니다"·"보상 5배" 모두 DB 설문엔 거짓이라 통째로 제외. */}
            {!isDbSurveyMode && (
            <div className={`rounded-md p-4 border mb-4 ${isFullyLinked ? "bg-green-50 border-green-200" : "bg-white border-blue-200"}`}>
              <div className="flex items-center gap-2 mb-3">
                {isFullyLinked
                  ? <><Zap className="w-4 h-4 text-green-600" /><span className="text-sm text-green-600 font-medium">마이데이터 연동 완료 — 자동 완성됩니다 🎉</span></>
                  : <><Database className="w-4 h-4 text-blue-600" /><span className="text-sm text-blue-600 font-medium">연동 데이터 기반 설문이 생성됩니다</span></>
                }
              </div>
              {isLoadingLinkedData ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />연동 데이터 확인 중...
                </div>
              ) : isFullyLinked ? (
                // ✅ 연동 완료 상태 표시
                <div className="space-y-2">
                  {linkedData?.financial.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-slate-600">{f.name}</span>
                      <span className="text-slate-500 text-xs">({f.type})</span>
                    </div>
                  ))}
                  {linkedData?.government.map((g, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-slate-600">{g.name}</span>
                      <span className="text-slate-500 text-xs">({g.type})</span>
                    </div>
                  ))}
                  <p className="text-green-600/70 text-xs mt-2 pt-2 border-t border-green-200">
                    ✅ 타이핑 입력 없이 자동으로 설문이 완성됩니다.
                  </p>
                </div>
              ) : (
                // 연동 없음 상태
                <div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>금융 데이터: {linkedDataCount.financial}개 기관</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>정부 데이터: {linkedDataCount.government}개 기관</span>
                    </div>
                  </div>
                  <p className="text-amber-600 text-xs mt-2">
                    직접 입력 방식으로 진행합니다.
                  </p>
                </div>
              )}
            </div>
            )}

            {/* 이름 입력칸(형식적·DB 저장 0건) 제거 → 명시적 동의 체크박스 1개.
                동의 행위 없이 survey_ethics 를 "동의"로 기록하지 않기 위한 최소 근거. */}
            <label className="flex items-start gap-3 bg-white rounded-md p-4 border border-slate-200 cursor-pointer">
              {/* 터치 히트영역 확보를 위해 label 전체를 누를 수 있게 함 */}
              <Checkbox
                checked={pledgeAgreed}
                onCheckedChange={(checked) => setPledgeAgreed(checked === true)}
                className="mt-0.5 rounded-[4px] border-slate-300 data-[state=checked]:bg-trust data-[state=checked]:border-trust"
              />
              <span className="text-sm text-slate-600 leading-relaxed">위 내용을 확인했고, 정직하게 응답하겠습니다.</span>
            </label>
          </div>

          <div className="flex items-center text-xs text-slate-500 mb-6 px-2">
            <span>서약일: {new Date().toLocaleDateString('ko-KR')}</span>
          </div>

          <Button
            onClick={handlePledgeSubmit}
            disabled={!pledgeAgreed || isLoadingLinkedData}
            /* 라이트 전환(2단계): inline 그라데이션 → 단색. TDS fill variant 기준.
               🔙 되돌리려면 style={{ background: isFullyLinked
                  ? "linear-gradient(135deg, #22C55E, #16a34a)"
                  : "linear-gradient(135deg, #3182F6, #1a6fd4)" }} */
            className={`w-full h-14 rounded-md text-white font-medium text-base ${
              isFullyLinked ? "bg-green-600 hover:bg-green-700" : "bg-trust hover:bg-trust-dark"
            }`}
          >
            {isLoadingLinkedData ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />데이터 확인 중...</>
            ) : isFullyLinked ? (
              <><Zap className="w-5 h-5 mr-2" />확인하고 자동 완성 시작하기 (+100 VN)</>
            ) : (
              <>확인하고 설문 시작하기<ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP 1.5: Generating Questions ──────────────────────────────────────
  if (currentStep === "generating_questions") {
    return (
      <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <BackLink onClick={onBack} floating />
        <div className="max-w-lg w-full text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-500 border-r-cyan-400 animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-4 rounded-full border-2 border-transparent border-b-indigo-500 border-l-purple-400 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            <div className="absolute inset-6 rounded-full bg-blue-600 flex items-center justify-center">
              <Brain className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {isFullyLinked ? "🔗 연동 데이터 자동 완성 중..." : "🤖 AI가 맞춤 질문을 생성하고 있습니다"}
          </h2>
          <p className="text-blue-600 font-mono text-sm animate-pulse mb-6">
            {generationStage || "초기화 중..."}
          </p>
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>{isFullyLinked ? "자동 완성 중" : "질문 생성 중"}</span>
              <span>{Math.round(generationProgress)}%</span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${generationProgress}%` }} />
            </div>
          </div>
          {/* ✅ 연동 완료 시 자동 완성 내용 표시 */}
          {isFullyLinked ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-left">
              <p className="text-xs text-green-600 mb-3 font-medium">✅ 자동 완성되는 데이터:</p>
              <div className="space-y-2">
                {linkedData?.financial.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-600">{f.name}</span>
                    <span className="text-slate-500 text-xs">({f.type})</span>
                  </div>
                ))}
                {linkedData?.government.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-green-600" />
                    <span className="text-slate-600">{g.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-green-600/60 text-xs mt-3">타이핑 없이 바로 보안 검증으로 이동합니다 🚀</p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-left">
              <p className="text-xs text-slate-500 mb-3">분석 중인 연동 데이터:</p>
              <div className="space-y-2">
                {linkedData?.financial.map((f, idx) => (
                  <div key={`fin-${idx}`} className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-slate-600">{f.name}</span>
                  </div>
                ))}
                {linkedData?.transactionCategories.length ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-amber-600" />
                    <span className="text-slate-600">주요 거래: {linkedData.transactionCategories.slice(0, 3).join(', ')}</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          <p className="text-slate-400 text-xs mt-6">🔒 연동된 데이터만 분석에 사용됩니다</p>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Survey Questions (연동 없을 때만 도달) ───────────────────────
  if (currentStep === "survey") {
    const currentQ = surveyQuestions[currentQuestionIndex];
    if (!currentQ) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      );
    }
    // 조건1·조건4: 객관식은 options 순서 그대로 버튼 렌더. scale 은 1~5 고정 척도 버튼(2026-08-13 구현).
    const qOptions = currentQ.options ?? [];
    const isSingle = currentQ.type === "single_choice" && qOptions.length > 0;
    const isMultiChoice = currentQ.type === "multi_choice" && qOptions.length > 0;
    const isScale = currentQ.type === "scale";
    const isChoice = isSingle || isMultiChoice;
    // 척도는 options 를 쓰지 않는다 — 1~5 고정. 저장은 "1"~"5" 문자열.
    const SCALE_VALUES = ["1", "2", "3", "4", "5"];
    // 10자 강제 폐지: single=1개 선택 / multi=최소 1개 선택 / scale=1개 선택 / text·fallback=빈칸만 방지(1자 이상)
    const canProceed = isSingle || isScale
      ? currentAnswer.length > 0
      : isMultiChoice
        ? selectedMulti.length > 0
        : currentAnswer.trim().length >= 1;
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-lg mx-auto">
          <BackLink onClick={handleSurveyBack} label={EXIT_SURVEY_LABEL} />
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
              <span>질문 {currentQuestionIndex + 1} / {surveyQuestions.length}</span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-600" />입력 모니터링 중
              </span>
            </div>
            <Progress value={(currentQuestionIndex + 1) / surveyQuestions.length * 100} className="h-2 bg-slate-100" />
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 font-semibold shrink-0">
                Q{currentQ.id}
              </div>
              <div className="flex-1">
                <p className="text-lg text-slate-900 font-medium leading-relaxed whitespace-pre-line">{currentQ.text}</p>
                {currentQ.targetSource && currentQ.type !== 'trap' && (
                  <p className="text-xs text-blue-600 mt-2">📊 {currentQ.targetSource} 연동 데이터 기반 질문</p>
                )}
              </div>
            </div>
            {isChoice ? (
              // 객관식: options 배열 순서 그대로(조건1). single=단일선택, multi=복수토글.
              <div className="space-y-3">
                {qOptions.map((opt, idx) => {
                  const selected = isMultiChoice ? selectedMulti.includes(opt) : currentAnswer === opt;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (isMultiChoice) {
                          setSelectedMulti(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
                        } else {
                          setCurrentAnswer(opt);
                        }
                      }}
                      className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-md border transition-colors ${
                        selected
                          ? "bg-blue-50 border-blue-500 text-slate-900"
                          : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        selected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {selected && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
                {isMultiChoice && (
                  <p className="text-xs text-slate-500 pt-1">복수 선택 가능</p>
                )}
              </div>
            ) : isScale ? (
              // scale: 1~5 고정 척도. options 를 쓰지 않으며 선택 스타일은 객관식과 동일.
              <div>
                <div className="flex items-stretch gap-2">
                  {SCALE_VALUES.map((val) => {
                    const selected = currentAnswer === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCurrentAnswer(val)}
                        className={`flex-1 flex items-center justify-center py-4 rounded-md border text-lg font-semibold transition-colors ${
                          selected
                            ? "bg-blue-50 border-blue-500 text-slate-900"
                            : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>전혀 아니다</span>
                  <span>매우 그렇다</span>
                </div>
              </div>
            ) : (
              // text: 자유입력. 붙여넣기·타이핑 감지 유지(조건4 — 손대지 않음).
              <>
                <Textarea
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="경험에 기반한 솔직한 답변을 작성해주세요..."
                  className="bg-white border-slate-200 text-slate-900 min-h-[150px] placeholder:text-slate-500"
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (text.length >= 100) {
                      e.preventDefault();
                      toast({ title: "⚠️ 붙여넣기 차단", description: "100자 이상 붙여넣기는 허용되지 않습니다.", variant: "destructive" });
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <span>{currentAnswer.length}자 입력</span>
                  <span>타이핑 속도: {charCount > 0 ? Math.round(charCount / ((Date.now() - questionStartTime) / 1000)) : 0} 자/초</span>
                </div>
              </>
            )}
          </div>
          {!isChoice && !isScale && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs text-amber-600">입력 속도와 패턴이 실시간으로 기록됩니다.</span>
            </div>
          )}
          <Button
            onClick={handleNextQuestion}
            disabled={!canProceed}
            className="w-full h-14 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {currentQuestionIndex < surveyQuestions.length - 1
              ? "다음 질문"
              : (isDbSurveyMode ? "응답 완료" : "교차 검증으로 이동")}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
        {exitConfirmDialog}
      </div>
    );
  }

  // ─── STEP 3: Cross Verify ─────────────────────────────────────────────────
  if (currentStep === "cross_verify") {
    const currentCrossVerify = answers[crossVerifyIndex];
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-lg mx-auto">
          <BackLink onClick={handleSurveyBack} label={EXIT_SURVEY_LABEL} />
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-500 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">교차 검증</h2>
            <p className="text-slate-500 text-sm">이전 답변의 일관성을 확인합니다</p>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
            <span>검증 {crossVerifyIndex + 1} / {answers.length}</span>
          </div>
          <Progress value={(crossVerifyIndex + 1) / answers.length * 100} className="h-2 bg-slate-100 mb-6" />
          <div className="bg-slate-50 border border-slate-200/50 rounded-md p-4 mb-4">
            <div className="text-xs text-slate-500 mb-2">당신의 이전 답변:</div>
            <p className="text-slate-600 text-sm italic">"{currentCrossVerify?.answer.slice(0, 100)}..."</p>
          </div>
          <div className="bg-white border border-amber-200 rounded-md p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Eye className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-slate-900 font-medium">
                위 답변에서 언급한 내용을 더 구체적으로 설명해주세요.
                <br />
                <span className="text-sm text-slate-500 mt-1 block">(예: 브랜드명, 가격대, 구매 장소, 사용 기간 등)</span>
              </p>
            </div>
            <Textarea
              placeholder="구체적인 세부 정보를 입력해주세요..."
              className="bg-white border-slate-200 text-slate-900 min-h-[120px] placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  const target = e.target as HTMLTextAreaElement;
                  if (target.value.trim().length >= 10) handleCrossVerifyAnswer(target.value);
                }
              }}
            />
          </div>
          <Button
            onClick={(e) => {
              const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
              if (textarea && textarea.value.trim().length >= 10) {
                handleCrossVerifyAnswer(textarea.value);
              } else {
                toast({ title: "답변을 입력해주세요", description: "최소 10자 이상 입력해주세요.", variant: "destructive" });
              }
            }}
            className="w-full h-14 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-medium"
          >
            {crossVerifyIndex < answers.length - 1 ? "다음 검증" : "검증 완료"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
        {exitConfirmDialog}
      </div>
    );
  }

  // ─── STEP 4: Security Scan ────────────────────────────────────────────────
  if (currentStep === "security_scan") {
    /* 2026-08-29 — 「보안 분석 진행 중」 화면을 저장 화면으로 바꿨다.
       지운 것: 진행률 %(가짜) · 「보안 분석 진행 중」 · 「금융급 보안 프로토콜 적용 중」 ·
                scanStages 5종(타이핑 패턴 분석/마우스 궤적 검증/응답 일관성 교차 검증/
                행동 패턴 이상 탐지/무결성 인증서 발급) · 영문 부제 전부.
       이유: ①그 시점에 실행되는 것은 응답 저장과 보상 적립 둘뿐이었다
             ②「이상 탐지」는 응답자를 용의자로 세우는 표현이다 —
               의심은 기계가 조용히 한다(질문 헌장).
       남은 문구 2개는 실제로 실행 중인 함수와 1:1 대응한다. */
    const phaseText = scanPhase === "saving"
      ? "응답을 저장하고 있어요…"
      : "리워드를 적립하고 있어요…";
    return (
      <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <BackLink onClick={handleSurveyBack} floating label={EXIT_SURVEY_LABEL} />
        <div className="max-w-lg w-full text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-6 text-blue-600 animate-spin" />
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">{phaseText}</h2>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-left">
            {/* 이름칸 제거로 "서약자" 칸 삭제, "프로토콜(ACP v2.0)" 칸도 삭제(감시 톤 제거).
                2×2 → 남은 두 칸(데이터 방식·응답 수)만. 3칸 재배치하지 않음. */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><span className="text-slate-500">데이터 방식</span><p className={`font-medium ${isFullyLinked ? "text-green-600" : "text-slate-600"}`}>{isFullyLinked ? "마이데이터 연동" : "직접 입력"}</p></div>
              <div><span className="text-slate-500">응답 수</span><p className="text-slate-600 font-medium">{answers.length}개</p></div>

            </div>
          </div>
          {/* 사실인 범위로만 남긴다 — https 로 전송된다는 것 외에 주장하지 않는다. */}
          <p className="text-slate-400 text-xs mt-6">🔒 암호화된 연결로 전송됩니다</p>
        </div>
        {exitConfirmDialog}
      </div>
    );
  }

  // ─── 구간G: 참여 불가(닫힘·없음) 안내 ────────────────────────────────────
  //   closed/없는 설문 딥링크로 진입 시 무한 스피너 대신 이 화면을 보여준다.
  if (currentStep === "unavailable") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
            <AlertTriangle className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">참여할 수 없는 설문입니다</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            이미 종료되었거나 존재하지 않는 설문이에요.<br />
            수익 쌓기 탭에서 참여 가능한 설문을 확인해보세요.
          </p>
          <Button
            onClick={onGoToEarn ?? onBack}
            className="w-full h-14 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            수익 쌓기 탭으로
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP 5: Complete ─────────────────────────────────────────────────────
  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-600 rounded-full flex items-center justify-center animate-scale-in">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          {/* 구간F-1(C-2): 판정 근거 없는 "무결성/보안 통과" 단정 → 사실 문구로 교체(Ray 승인 후보③ 확정). */}
          <h2 className="text-2xl font-bold text-slate-900 mb-2">응답 제출 완료</h2>
          <p className="text-slate-500 mb-2">소중한 응답 감사합니다</p>
          {/* C-3: 적립 결과(claimOutcome)에 따라 문구 분기. 성공에서만 금액을 노출한다. */}
          {isDbSurveyMode && claimOutcome === "success" && (
            <p className="text-green-600 text-sm font-semibold mb-6">🎉 설문 참여로 +{(rewardVn ?? 0).toLocaleString()} VN이 적립되었습니다</p>
          )}
          {isDbSurveyMode && claimOutcome === "already" && (
            <p className="text-slate-600 text-sm font-semibold mb-6">이미 지급받은 설문입니다</p>
          )}
          {isDbSurveyMode && claimOutcome === "failed" && (
            <div className="mb-6">
              <p className="text-amber-600 text-sm font-semibold">⚠️ 응답은 저장되었지만 보상 적립이 처리되지 않았습니다</p>
              <p className="text-slate-500 text-sm mt-1">{claimFailMsg ?? "보상 적립에 실패했습니다. 잠시 후 다시 시도해 주세요"}</p>
            </div>
          )}
          {isFullyLinked && (
            <p className="text-green-600 text-sm font-semibold mb-6">🎉 마이데이터 연동으로 자동 완성되었습니다</p>
          )}
          {/* B-47: '데이터 방식(직접 입력)' 박스 제거 — 파란 글씨+어두운 박스라 입력칸으로 오인.
              연동 기능이 첫 출시 제외(B-36 숨김)라 방식 구분 자체가 현재 무의미. */}
          <Button
            onClick={onComplete}
            className="w-full h-14 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            {/* C-3: DB 설문 모드는 결과별 라벨(금액은 위 안내문에만). */}
            {/* B-29 1단계: 인증 모드 보상은 Ray 확정 2항에 따라 100 VN 고정이다.
                grant_verification_reward RPC 에 isFullyLinked 분기가 없으므로
                (isFullyLinked ? 500 : 100) 라벨은 서버 실제 지급액과 어긋났다.
                라벨은 서버가 주는 값과 일치해야 한다. */}
            {isDbSurveyMode
              ? (claimOutcome === "failed" ? "닫기" : "완료")
              : `완료하고 보상 받기 (+${(100).toLocaleString()} VN)`}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default AntiCherryPickerSurveyView;
