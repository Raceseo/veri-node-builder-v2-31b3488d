/**
 * VeriNode Index Page
 * Phase 2: 간소화된 엔트리 포인트
 * 
 * 이 파일은 온보딩 완료 여부를 확인하고 적절한 레이아웃으로 리다이렉트합니다.
 * 기존 877줄 → ~50줄로 축소
 */

import React, { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileContext } from "@/contexts/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { consumePendingSurvey, clearPendingSurvey } from "@/lib/pendingSurvey";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { SubscriptionCreateSheet } from "@/components/corporate/SubscriptionCreateSheet";
import { DataRequestSheet } from "@/components/corporate/DataRequestSheet";

// Lazy load layouts
const SupplierLayout = lazy(() => import("@/components/layouts/SupplierLayout"));
const DemandLayout = lazy(() => import("@/components/layouts/DemandLayout"));

// Lazy load onboarding views
const IntroView = lazy(() => import("@/components/views/IntroView"));
const SovereigntyDeclarationView = lazy(() => import("@/components/views/SovereigntyDeclarationView"));
const SocialPromiseView = lazy(() => import("@/components/views/SocialPromiseView"));
// 2026-08-22 — DualModeEntryView lazy import 제거(역할 선택 단계 삭제). 파일은 남아 있다.

type OnboardingStep = 'intro' | 'sovereignty' | 'promise' | 'complete';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isLoading, refetch } = useProfileContext();
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep | null>(null);
  const [userMode, setUserMode] = useState<'supplier' | 'demand'>('supplier');
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  
  // 기업 모드 Sheet 상태
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isDataRequestOpen, setIsDataRequestOpen] = useState(false);

  // 구간H: surveyId 를 URL 에 복원하고 SupplierLayout(공급자)으로 진입시킨다.
  //   (SupplierLayout 이 window.location.search 에서 surveyId 를 읽어 DB 설문 모드로 들어감)
  const enterSurveyMode = (id: string) => {
    window.history.replaceState(null, '', '/?surveyId=' + id);
    setUserMode('supplier');
    setOnboardingStep('complete');
  };

  // 온보딩 상태 결정
  useEffect(() => {
    if (isLoading) return;

    if (profile?.onboarding_completed) {
      // 기업 계정: 설문은 제공자용이므로 스태시를 즉시 삭제(구간H 조건1)하고 기업 화면으로
      if (profile.user_type === 'enterprise') {
        clearPendingSurvey();
        navigate('/enterprise', { replace: true });
        return;
      }

      // 개인: ①URL 의 surveyId 우선(있으면 스태시 잔재 정리) → ②없으면 스태시 폴백(1회 소비)
      const urlSurveyId = new URLSearchParams(window.location.search).get('surveyId');
      if (urlSurveyId) {
        clearPendingSurvey();
        setUserMode('supplier');
        setOnboardingStep('complete');
        return;
      }
      const stashedSurveyId = consumePendingSurvey();
      if (stashedSurveyId) {
        enterSurveyMode(stashedSurveyId);
        return;
      }

      // 구간②-B: 딥링크 없는 개인은 SupplierLayout(설문 목록·지갑)으로 착지.
      //   위 urlSurveyId 분기와 같은 착지 — surveyId 처리만 없는 형태.
      setUserMode('supplier');
      setOnboardingStep('complete');
      return;
    }

    // B-20: 랜딩(IntroView)은 가입 전에 RootEntry 가 이미 보여줬다.
    //   여기서 다시 'intro' 로 보내면 가입 직후 같은 화면이 한 번 더 떠서
    //   "가입이 안 됐나?" 하는 혼란을 준다. → 온보딩 2단계부터 시작한다.
    setOnboardingStep('sovereignty');
  }, [profile, isLoading, navigate]);

  const completeOnboarding = async (type: 'individual' | 'enterprise' | null) => {
    if (!profile?.id) return;

    const nextUserType = type === 'enterprise' ? 'enterprise' : 'individual';
    setIsCompletingOnboarding(true);

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true, user_type: nextUserType })
      .eq('id', profile.id);

    if (error) {
      console.error('온보딩 완료 저장 실패:', error);
      toast({
        title: '온보딩 저장 실패',
        description: '잠시 후 다시 시도해 주세요.',
        variant: 'destructive',
      });
      setIsCompletingOnboarding(false);
      return;
    }

    refetch();

    // 기업 계정: 스태시 삭제(조건1) 후 기업 화면으로
    if (nextUserType === 'enterprise') {
      clearPendingSurvey();
      navigate('/enterprise', { replace: true });
      return;
    }

    // 개인 신규가입: URL 우선 → 스태시 폴백. 있으면 /dashboard 대신 설문으로 직행(구간H)
    const urlSurveyId = new URLSearchParams(window.location.search).get('surveyId');
    const targetSurveyId = urlSurveyId || consumePendingSurvey();
    if (targetSurveyId) {
      enterSurveyMode(targetSurveyId);
      setIsCompletingOnboarding(false);
      return;
    }

    // 구간②-B: 딥링크 없는 개인 신규가입도 SupplierLayout으로 착지.
    setUserMode('supplier');
    setOnboardingStep('complete');
    setIsCompletingOnboarding(false);
  };

  // 로딩 중
  if (isLoading || onboardingStep === null || isCompletingOnboarding) {
    return <LoadingSpinner text="VeriNode 로딩 중..." />;
  }

  // 온보딩 플로우
  // B-19 이후 비로그인 랜딩(RootEntry)이 담당한다. 이 경로는 도달하지 않음.
  // 되돌릴 여지를 위해 남겨둠.
  if (onboardingStep === 'intro') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <IntroView onStart={() => setOnboardingStep('sovereignty')} />
      </Suspense>
    );
  }

  if (onboardingStep === 'sovereignty') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <SovereigntyDeclarationView onComplete={() => setOnboardingStep('promise')} />
      </Suspense>
    );
  }

  if (onboardingStep === 'promise') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        {/* 2026-08-22 — 서약 다음이 곧 온보딩 완료다. 사이에 있던 역할 선택
            (select-mode / DualModeEntryView)을 걷어냈다 — 아래 주석 참조. */}
        <SocialPromiseView
          onComplete={() => completeOnboarding('individual')}
        />
      </Suspense>
    );
  }

  /* 2026-08-22 — 온보딩 역할 선택(select-mode) 단계 제거.
     「기업」을 고르면 setUserMode('demand') 로 실데이터에 연결되지 않은
     더미 화면(Demand*, B-90)에 착지했다. 신규 가입자가 첫인상으로 가짜를 보고,
     새로고침하면 /enterprise 로 가 다른 화면이 나오는 상태였다.
     기업 문은 아직 열지 않았으므로(수요 사다리 ②단계) 선택 자체를 없앴다.
     선택지가 하나뿐이면 그건 선택이 아니라 클릭 한 번을 더 받는 빈 단계다.
     → 서약 완료 시 곧바로 completeOnboarding('individual') 한다.
     Auth.tsx 의 「가입 유형」 선택도 같은 이유로 함께 제거했다. */

  // 온보딩 완료 후 - 사용자 모드에 따라 레이아웃 표시
  if (userMode === 'demand') {
    return (
      <>
        <Suspense fallback={<LoadingSpinner />}>
          <DemandLayout 
            companyName={profile?.company || "기업"}
            onSwitchToSupplier={() => setUserMode('supplier')}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            onOpenDataRequest={() => setIsDataRequestOpen(true)}
          />
        </Suspense>
        
        {/* 구독 서비스 Sheet */}
        <SubscriptionCreateSheet
          open={isSubscriptionOpen}
          onOpenChange={setIsSubscriptionOpen}
        />
        
        {/* 맞춤 데이터 요청 Sheet */}
        <DataRequestSheet
          open={isDataRequestOpen}
          onOpenChange={setIsDataRequestOpen}
          onClearTemplate={() => {}}
        />
      </>
    );
  }

  // 기본: 공급자(개인) 모드
  // 2026-08-22 — onSwitchToDemand 를 넘기지 않는다. 홈 헤더의 「기업 공급자 전환 →」
  //   버튼이 이 prop 유무로 렌더되므로(SupplierLayout:220) 이 한 줄이 진입점을 끊는다.
  //   도착하는 Demand* 화면 7개는 실데이터에 연결되지 않은 더미다(B-90).
  //   ⚠️ 위 userMode === 'demand' 분기와 :57 의 user_type === 'enterprise' 착지는
  //     그대로 남겨뒀다 — 실제 기업 계정 경로까지 막는 것은 범위 밖이다.
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SupplierLayout />
    </Suspense>
  );
};

export default Index;
