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
const DualModeEntryView = lazy(() => import("@/components/views/DualModeEntryView"));

type OnboardingStep = 'intro' | 'sovereignty' | 'promise' | 'select-mode' | 'complete';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isLoading, displayName, refetch } = useProfileContext();
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep | null>(null);
  const [userMode, setUserMode] = useState<'supplier' | 'demand'>('supplier');
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  
  // 기업 모드 Sheet 상태
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isDataRequestOpen, setIsDataRequestOpen] = useState(false);

  // 온보딩 상태 결정
  useEffect(() => {
    if (isLoading) return;

    if (profile?.onboarding_completed) {
      // ✅ 설문 딥링크(?surveyId): 공급자는 /dashboard 로 튕기지 않고 SupplierLayout 으로 진입시켜 설문을 연다.
      //    (SupplierLayout 이 window.location.search 에서 surveyId 를 읽어 DB 설문 모드로 들어감)
      const hasSurveyDeepLink = new URLSearchParams(window.location.search).has('surveyId');
      if (hasSurveyDeepLink && profile.user_type !== 'enterprise') {
        setUserMode('supplier');
        setOnboardingStep('complete');
        return;
      }
      navigate(profile.user_type === 'enterprise' ? '/enterprise' : '/dashboard', { replace: true });
      return;
    }

    setOnboardingStep('intro');
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
    navigate(nextUserType === 'enterprise' ? '/enterprise' : '/dashboard', { replace: true });
  };

  // 로딩 중
  if (isLoading || onboardingStep === null || isCompletingOnboarding) {
    return <LoadingSpinner text="VeriNode 로딩 중..." />;
  }

  // 온보딩 플로우
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
        <SocialPromiseView 
          displayName={displayName}
          onComplete={() => setOnboardingStep('select-mode')} 
        />
      </Suspense>
    );
  }

  if (onboardingStep === 'select-mode') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <DualModeEntryView 
          onComplete={async (type) => {
            setUserMode(type === 'enterprise' ? 'demand' : 'supplier');
            await completeOnboarding(type);
          }}
        />
      </Suspense>
    );
  }

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
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SupplierLayout 
        onSwitchToDemand={() => setUserMode('demand')}
      />
    </Suspense>
  );
};

export default Index;
