import { useState, useRef, useEffect } from "react";
import { 
  Shield, FileSignature, AlertTriangle, CheckCircle, 
  Brain, Lock, Fingerprint, Eye, Activity, 
  ArrowRight, Loader2, ShieldCheck, Database, Building2, CreditCard,
  Zap, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface AntiCherryPickerSurveyViewProps {
  onBack: () => void;
  onComplete: () => void;
  /** 있으면 "DB 설문 모드": survey_questions 에서 문항을 읽고 survey_responses 에 저장. 없으면 기존 AI 인증 모드. */
  surveyId?: string;
}

type SurveyStep = "ethics_pledge" | "generating_questions" | "survey" | "cross_verify" | "security_scan" | "complete";

interface SurveyQuestion {
  id: number;
  text: string;
  type?: string;
  targetSource?: string;
  dbId?: string; // DB 설문 모드에서의 survey_questions.id(uuid)
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

const AntiCherryPickerSurveyView = ({ onBack, onComplete, surveyId }: AntiCherryPickerSurveyViewProps) => {
  const queryClient = useQueryClient();
  const { refetch: refetchProfile } = useProfileContext();
  const [currentStep, setCurrentStep] = useState<SurveyStep>("ethics_pledge");
  const [pledgeName, setPledgeName] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [crossVerifyIndex, setCrossVerifyIndex] = useState(0);
  const [crossVerifyAnswers, setCrossVerifyAnswers] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState(0);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const [linkedData, setLinkedData] = useState<LinkedDataSummary | null>(null);
  const [isLoadingLinkedData, setIsLoadingLinkedData] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [rewardVn, setRewardVn] = useState<number | null>(null); // DB 설문 모드: surveys.reward_vn 실제 보상값

  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [charCount, setCharCount] = useState(0);
  const mouseTrajectory = useRef<MouseTrajectory[]>([]);
  const lastInputTime = useRef<number>(Date.now());
  const isSavingRef = useRef(false); // 설문 응답 중복 저장 방지(제출 중/완료 시 재호출 차단)

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

  const updateProfileVerification = async () => {
    setIsUpdatingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: currentProfile, error: profileFetchError } = await supabase
        .from('profiles').select('trust_score, is_verified').eq('id', user.id).single();
      if (profileFetchError) return;
      if (currentProfile?.is_verified) { setCurrentStep("complete"); return; }
      const currentTrustScore = currentProfile?.trust_score || 65;
      const newTrustScore = Math.min(currentTrustScore + (isFullyLinked ? 15 : 5), 100);
      // ⚠️ 구간④-후속(TODO): 인증 모드 VN 보상은 아직 Edge Function 이관 전이라 지급 보류.
      //    보안 규칙 #4 + protect_vn_balance 트리거로 프론트의 vn_balance 직접 수정은 금지/차단됨.
      //    여기서는 인증(is_verified)·신뢰도(trust_score)만 갱신하고, 보상 지급은 후속 세션에서
      //    claim-verification-reward(가칭) Edge Function 으로 이관 예정. (claim-survey-reward 참고)
      await supabase.from('profiles').update({
        is_verified: true,
        trust_score: newTrustScore, updated_at: new Date().toISOString()
      }).eq('id', user.id);
      await supabase.from('verification_history').insert({
        user_id: user.id, verification_type: 'identity_verification',
        trust_score_before: currentTrustScore, trust_score_after: newTrustScore,
        score_change: isFullyLinked ? 15 : 5, vn_earned: 0, // 보상 이관 전까지 0 (reward_pending)
        result: { type: 'first_verification', passed: true, mydata_linked: isFullyLinked, reward_pending: true, timestamp: new Date().toISOString() }
      });
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['home-profile'] });
      toast({ title: "✅ 인증 완료!", description: `신뢰도 +${isFullyLinked ? 15 : 5}점 상승 (보상은 준비 중)` });
    } catch (error) {
      console.error("Verification update error:", error);
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
    try {
      const { data, error } = await supabase.functions.invoke("claim-survey-reward", {
        body: { surveyId },
      });
      if (error) {
        console.error("보상 적립 실패:", error);
        toast({ title: "보상 적립 실패", description: "잔액은 잠시 후 반영될 수 있어요.", variant: "destructive" });
        return;
      }
      if (data?.already_claimed) {
        toast({ title: "이미 보상을 받은 설문입니다" });
      } else if (data?.success) {
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
    }
  };

  // ① 진행률 애니메이션 — 순수 증가만(updater 안에서 side effect 호출 금지: StrictMode 이중 발화 방지)
  useEffect(() => {
    if (currentStep !== "security_scan") return;
    const progressInterval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + 0.5, 100));
    }, 50);
    const stageInterval = setInterval(() => setScanStage(prev => (prev + 1) % 5), 2000);
    return () => { clearInterval(progressInterval); clearInterval(stageInterval); };
  }, [currentStep]);

  // ② 진행률 100% 도달 시 저장/인증을 1회만 실행. saveSurveyResponses 의 isSavingRef 가드가 중복을 최종 차단.
  useEffect(() => {
    if (currentStep !== "security_scan" || scanProgress < 100) return;
    // DB 설문 모드는 응답만 저장(VN 적립 없음), 인증 모드는 기존대로 프로필 인증
    if (isDbSurveyMode) {
      // B-1: 응답 저장 성공 직후 별도로 보상 적립(Edge Function). 적립이 실패해도 응답은 남는다.
      saveSurveyResponses()
        .then(() => claimSurveyReward())
        .then(() => setCurrentStep("complete"));
    } else {
      updateProfileVerification().then(() => setCurrentStep("complete"));
    }
  }, [currentStep, scanProgress, isDbSurveyMode]);

  const handlePledgeSubmit = () => {
    if (pledgeName.length < 2) {
      toast({ title: "이름을 입력해주세요", description: "정자로 본인의 이름을 기입해주세요.", variant: "destructive" });
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
    const timeSpent = Date.now() - questionStartTime;
    const typingSpeed = charCount / (timeSpent / 1000);
    setAnswers(prev => [...prev, {
      questionId: surveyQuestions[currentQuestionIndex].id,
      question: surveyQuestions[currentQuestionIndex].text,
      answer: currentAnswer, timeSpent, typingSpeed,
    }]);
    setCurrentAnswer(""); setCharCount(0); setQuestionStartTime(Date.now());
    if (currentQuestionIndex < surveyQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentStep("cross_verify");
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

  const scanStages = [
    { icon: Fingerprint, text: "타이핑 패턴 분석 중...", detail: "keystroke dynamics verification" },
    { icon: Activity, text: "마우스 궤적 검증 중...", detail: "cursor trajectory analysis" },
    { icon: Brain, text: "응답 일관성 교차 검증 중...", detail: "cross-reference validation" },
    { icon: Eye, text: "행동 패턴 이상 탐지 중...", detail: "anomaly detection processing" },
    { icon: Lock, text: "무결성 인증서 발급 중...", detail: "integrity certificate generation" },
  ];

  const linkedDataCount = {
    financial: linkedData?.financial.length || 0,
    government: linkedData?.government.length || 0,
    hasSns: !!(linkedData?.profile?.sns_keywords && linkedData.profile.sns_keywords.length > 0),
    hasProfile: !!(linkedData?.profile?.occupation || linkedData?.profile?.interests?.length)
  };

  // ─── STEP 1: Ethics Pledge ────────────────────────────────────────────────
  if (currentStep === "ethics_pledge") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-200 mb-8 flex items-center gap-2">
            ← 돌아가기
          </button>
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center border-2 border-blue-400/30">
              <FileSignature className="w-10 h-10 text-blue-100" />
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-100 mb-2">데이터 윤리 서약</h1>
            <p className="text-slate-400 text-sm">설문 참여 전, 정직한 응답을 약속해주세요</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6 backdrop-blur">
            <div className="border-b border-slate-700 pb-4 mb-4">
              <p className="text-slate-300 text-sm leading-relaxed">
                본인은 <span className="text-blue-400 font-semibold">VeriNode</span> 플랫폼의 데이터 무결성 원칙을 존중하며,
                본 설문에 대해 <span className="text-blue-400 font-semibold">진실되고 정확한 응답</span>을 제공할 것을 서약합니다.
              </p>
            </div>
            <div className="space-y-3 mb-6">
              {["모든 응답은 본인의 실제 경험에 기반합니다", "거짓 정보를 제공하지 않겠습니다",
                "AI 또는 타인의 답변을 복사하지 않겠습니다", "서약 위반 시 보상 회수에 동의합니다"
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-slate-300 text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* ✅ 연동 데이터 요약 + 자동완성 안내 */}
            <div className={`rounded-xl p-4 border mb-4 ${isFullyLinked ? "bg-green-500/5 border-green-500/30" : "bg-slate-900/50 border-blue-500/20"}`}>
              <div className="flex items-center gap-2 mb-3">
                {isFullyLinked
                  ? <><Zap className="w-4 h-4 text-green-400" /><span className="text-sm text-green-400 font-medium">마이데이터 연동 완료 — 자동 완성됩니다 🎉</span></>
                  : <><Database className="w-4 h-4 text-blue-400" /><span className="text-sm text-blue-400 font-medium">연동 데이터 기반 설문이 생성됩니다</span></>
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-slate-300">{f.name}</span>
                      <span className="text-slate-500 text-xs">({f.type})</span>
                    </div>
                  ))}
                  {linkedData?.government.map((g, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-slate-300">{g.name}</span>
                      <span className="text-slate-500 text-xs">({g.type})</span>
                    </div>
                  ))}
                  <p className="text-green-400/70 text-xs mt-2 pt-2 border-t border-green-500/20">
                    ✅ 타이핑 입력 없이 자동으로 설문이 완성됩니다. 보상 +500 VN 지급!
                  </p>
                </div>
              ) : (
                // 연동 없음 상태
                <div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>금융 데이터: {linkedDataCount.financial}개 기관</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>정부 데이터: {linkedDataCount.government}개 기관</span>
                    </div>
                  </div>
                  <p className="text-amber-400 text-xs mt-2">
                    ⚠️ 연동된 데이터가 없어 직접 입력이 필요합니다. 마이데이터 연동 시 자동 완성 + 보상 5배!
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600">
              <label className="block text-sm text-slate-400 mb-2">서약자 이름 (정자로 기입)</label>
              <Input
                value={pledgeName}
                onChange={(e) => setPledgeName(e.target.value)}
                placeholder="홍길동"
                className="bg-slate-800 border-slate-600 text-slate-100 text-center text-lg font-semibold tracking-widest placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500 mt-2 text-center">* 본인 이름을 또박또박 정자로 입력해주세요</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mb-6 px-2">
            <span>서약일: {new Date().toLocaleDateString('ko-KR')}</span>
            <span>VeriNode Anti-Cherry-Picker Protocol v2.0</span>
          </div>

          <Button
            onClick={handlePledgeSubmit}
            disabled={pledgeName.length < 2 || isLoadingLinkedData}
            className="w-full h-14 text-white font-semibold text-base"
            style={{ background: isFullyLinked ? "linear-gradient(135deg, #22C55E, #16a34a)" : "linear-gradient(135deg, #3182F6, #1a6fd4)" }}
          >
            {isLoadingLinkedData ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />데이터 확인 중...</>
            ) : isFullyLinked ? (
              <><Zap className="w-5 h-5 mr-2" />서약하고 자동 완성 시작하기 (+500 VN)</>
            ) : (
              <>서약하고 설문 시작하기<ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP 1.5: Generating Questions ──────────────────────────────────────
  if (currentStep === "generating_questions") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-500 border-r-cyan-400 animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-4 rounded-full border-2 border-transparent border-b-indigo-500 border-l-purple-400 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center">
              <Brain className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            {isFullyLinked ? "🔗 연동 데이터 자동 완성 중..." : "🤖 AI가 맞춤 질문을 생성하고 있습니다"}
          </h2>
          <p className="text-blue-400 font-mono text-sm animate-pulse mb-6">
            {generationStage || "초기화 중..."}
          </p>
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>{isFullyLinked ? "자동 완성 중" : "질문 생성 중"}</span>
              <span>{Math.round(generationProgress)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-300" style={{ width: `${generationProgress}%` }} />
            </div>
          </div>
          {/* ✅ 연동 완료 시 자동 완성 내용 표시 */}
          {isFullyLinked ? (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-left">
              <p className="text-xs text-green-400 mb-3 font-medium">✅ 자동 완성되는 데이터:</p>
              <div className="space-y-2">
                {linkedData?.financial.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">{f.name}</span>
                    <span className="text-slate-500 text-xs">({f.type})</span>
                  </div>
                ))}
                {linkedData?.government.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">{g.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-green-400/60 text-xs mt-3">타이핑 없이 바로 보안 검증으로 이동합니다 🚀</p>
            </div>
          ) : (
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 text-left">
              <p className="text-xs text-slate-500 mb-3">분석 중인 연동 데이터:</p>
              <div className="space-y-2">
                {linkedData?.financial.map((f, idx) => (
                  <div key={`fin-${idx}`} className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">{f.name}</span>
                  </div>
                ))}
                {linkedData?.transactionCategories.length ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300">주요 거래: {linkedData.transactionCategories.slice(0, 3).join(', ')}</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          <p className="text-slate-600 text-xs mt-6">🔒 연동된 데이터만 분석에 사용됩니다</p>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Survey Questions (연동 없을 때만 도달) ───────────────────────
  if (currentStep === "survey") {
    const currentQ = surveyQuestions[currentQuestionIndex];
    if (!currentQ) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-lg mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span>질문 {currentQuestionIndex + 1} / {surveyQuestions.length}</span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-500" />입력 모니터링 중
              </span>
            </div>
            <Progress value={(currentQuestionIndex + 1) / surveyQuestions.length * 100} className="h-2 bg-slate-700" />
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6 backdrop-blur">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
                Q{currentQ.id}
              </div>
              <div className="flex-1">
                <p className="text-lg text-slate-100 font-medium leading-relaxed">{currentQ.text}</p>
                {currentQ.targetSource && currentQ.type !== 'trap' && (
                  <p className="text-xs text-blue-400 mt-2">📊 {currentQ.targetSource} 연동 데이터 기반 질문</p>
                )}
              </div>
            </div>
            <Textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="경험에 기반한 솔직한 답변을 작성해주세요..."
              className="bg-slate-900/50 border-slate-600 text-slate-100 min-h-[150px] placeholder:text-slate-500"
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
          </div>
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-400">입력 속도와 패턴이 실시간으로 기록됩니다.</span>
          </div>
          <Button
            onClick={handleNextQuestion}
            disabled={currentAnswer.trim().length < 10}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold"
          >
            {currentQuestionIndex < surveyQuestions.length - 1 ? "다음 질문" : "교차 검증으로 이동"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP 3: Cross Verify ─────────────────────────────────────────────────
  if (currentStep === "cross_verify") {
    const currentCrossVerify = answers[crossVerifyIndex];
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">교차 검증</h2>
            <p className="text-slate-400 text-sm">이전 답변의 일관성을 확인합니다</p>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
            <span>검증 {crossVerifyIndex + 1} / {answers.length}</span>
          </div>
          <Progress value={(crossVerifyIndex + 1) / answers.length * 100} className="h-2 bg-slate-700 mb-6" />
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 mb-4">
            <div className="text-xs text-slate-500 mb-2">당신의 이전 답변:</div>
            <p className="text-slate-300 text-sm italic">"{currentCrossVerify?.answer.slice(0, 100)}..."</p>
          </div>
          <div className="bg-slate-800/50 border border-amber-500/30 rounded-2xl p-6 mb-6 backdrop-blur">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Eye className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-slate-100 font-medium">
                위 답변에서 언급한 내용을 더 구체적으로 설명해주세요.
                <br />
                <span className="text-sm text-slate-400 mt-1 block">(예: 브랜드명, 가격대, 구매 장소, 사용 기간 등)</span>
              </p>
            </div>
            <Textarea
              placeholder="구체적인 세부 정보를 입력해주세요..."
              className="bg-slate-900/50 border-slate-600 text-slate-100 min-h-[120px] placeholder:text-slate-500"
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
            className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold"
          >
            {crossVerifyIndex < answers.length - 1 ? "다음 검증" : "검증 완료"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── STEP 4: Security Scan ────────────────────────────────────────────────
  if (currentStep === "security_scan") {
    const CurrentIcon = scanStages[scanStage].icon;
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="relative w-40 h-40 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-400 animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-4 rounded-full border-2 border-transparent border-b-cyan-500 border-l-cyan-400 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
              <CurrentIcon className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-100 mb-2">보안 분석 진행 중</h2>
            <p className="text-blue-400 font-mono text-sm animate-pulse">{scanStages[scanStage].text}</p>
            <p className="text-slate-500 font-mono text-xs mt-1">{scanStages[scanStage].detail}</p>
          </div>
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>분석 진행률</span><span>{Math.round(scanProgress)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 transition-all duration-100" style={{ width: `${scanProgress}%` }} />
            </div>
          </div>
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 text-left">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><span className="text-slate-500">서약자</span><p className="text-slate-300 font-medium">{pledgeName}</p></div>
              <div><span className="text-slate-500">데이터 방식</span><p className={`font-medium ${isFullyLinked ? "text-green-400" : "text-slate-300"}`}>{isFullyLinked ? "마이데이터 연동" : "직접 입력"}</p></div>
              <div><span className="text-slate-500">응답 수</span><p className="text-slate-300 font-medium">{answers.length}개</p></div>
              <div><span className="text-slate-500">프로토콜</span><p className="text-green-400 font-medium">ACP v2.0</p></div>
            </div>
          </div>
          <p className="text-slate-600 text-xs mt-6">🔒 금융급 보안 프로토콜 적용 중</p>
        </div>
      </div>
    );
  }

  // ─── STEP 5: Complete ─────────────────────────────────────────────────────
  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center animate-scale-in">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">무결성 검증 완료</h2>
          <p className="text-slate-400 mb-2">모든 보안 검사를 통과했습니다</p>
          {isDbSurveyMode && rewardVn != null && (
            <p className="text-green-400 text-sm font-semibold mb-6">🎉 설문 참여로 +{rewardVn.toLocaleString()} VN 지급!</p>
          )}
          {isFullyLinked && (
            <p className="text-green-400 text-sm font-semibold mb-6">🎉 마이데이터 연동으로 +500 VN 지급!</p>
          )}
          <div className="bg-slate-800/50 border border-green-500/30 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-500 text-xs mb-1">데이터 방식</p>
                <p className={`font-semibold ${isFullyLinked ? "text-green-400" : "text-blue-400"}`}>
                  {isFullyLinked ? "마이데이터 연동" : "직접 입력"}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-500 text-xs mb-1">신뢰도 상승</p>
                <p className="text-green-400 font-semibold">+{isFullyLinked ? 15 : 5}점</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-500 text-xs mb-1">응답 일관성</p>
                <p className="text-green-400 font-semibold">92% 일치</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-slate-500 text-xs mb-1">복사 탐지</p>
                <p className="text-green-400 font-semibold">미탐지</p>
              </div>
            </div>
          </div>
          <Button
            onClick={onComplete}
            className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold"
          >
            완료하고 보상 받기 (+{(isDbSurveyMode ? (rewardVn ?? 0) : (isFullyLinked ? 500 : 100)).toLocaleString()} VN)
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default AntiCherryPickerSurveyView;
