import { useState, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfileContext } from "@/contexts/ProfileContext";
import VeriNodeLogo from "@/components/VeriNodeLogo";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import QuickMenu from "@/components/navigation/QuickMenu";
import SupplierBottomNav, { SupplierTabType } from "@/components/navigation/SupplierBottomNav";
import TrustScoreHeader from "@/components/TrustScoreHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { toast } from "sonner";

// 2026-08-22 — DataLinkPromptStep import 제거(가짜 연동 화면, 백로그 B-92).
// 파일은 남아 있으나 이 줄이 없으면 번들에 실리지 않는다.

// Tab Content Views
import SupplierHomeTab from "@/components/tabs/supplier/SupplierHomeTab";
import SupplierEarnTab from "@/components/tabs/supplier/SupplierEarnTab";
import SupplierWalletTab from "@/components/tabs/supplier/SupplierWalletTab";
import SupplierSettingsTab from "@/components/tabs/supplier/SupplierSettingsTab";

// Lazy load sub-views
const AntiCherryPickerSurveyView = lazy(() => import("@/components/views/AntiCherryPickerSurveyView"));
const DataPortfolioView = lazy(() => import("@/components/views/DataPortfolioView"));
const VCoreAnonymizationView = lazy(() => import("@/components/views/VCoreAnonymizationView"));
const PartnerRevenueDashboard = lazy(() => import("@/components/views/PartnerRevenueDashboard"));
// 🔴 2026-08-22 — MyDataUploadView · DataCategoryMonitorView · ConsumptionReportView
//    lazy import 를 걷어냈다. 세 화면 모두 작동하지 않았고 둘은 거짓을 표시했다.
//    (가짜 연동 성공 · 실명 기관 제휴 허위 표시 · 없는 자산 850만원 · 난수 리포트)
//    상세는 QuickMenu.tsx 상단 주석과 백로그 B-86~B-89.
//    파일은 남아 있으나 이 세 줄이 없으면 번들에 실리지 않는다.
const RevenueSourceView = lazy(() => import("@/components/views/RevenueSourceView"));
const UnifiedPortfolioView = lazy(() => import("@/components/views/UnifiedPortfolioView"));

type InternalView =
  | 'main'
  | 'antiCherryPicker'
  | 'dataPortfolio'
  | 'vcoreAnonymization'
  | 'partnerRevenue'
  | 'revenueSource'
  | 'unifiedPortfolio';

const SupplierLayout = () => {
  const { user } = useAuth();
  const { trustScore, vnBalance, displayName, isVerified } = useProfileContext();
  const [activeTab, setActiveTab] = useState<SupplierTabType>("home");
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastEarnedPoints, setLastEarnedPoints] = useState(0);

  // ✅ DB 설문 딥링크: URL 에 ?surveyId=<uuid> 가 있으면 AntiCherryPicker 를 DB 설문 모드로 바로 진입.
  const dbSurveyId = new URLSearchParams(window.location.search).get('surveyId') ?? undefined;
  const [currentView, setCurrentView] = useState<InternalView>(dbSurveyId ? 'antiCherryPicker' : 'main');
  const [selectedEarning, setSelectedEarning] = useState<any>(null);
  // 구간②: 목록 카드에서 고른 설문 id (딥링크 dbSurveyId 와 같은 경로로 AntiCherryPicker 에 전달)
  const [activeSurveyId, setActiveSurveyId] = useState<string | undefined>(undefined);

  const handleEarnPoints = (points: number) => {
    setLastEarnedPoints(points);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedEarning(null);
    setActiveSurveyId(undefined);
  };

  // 구간②: 설문 목록 카드 클릭 → DB 설문 모드로 진입 (AI 인증 모드 handleStartSurvey 와 별개)
  const handleStartDbSurvey = (id: string) => {
    setActiveSurveyId(id);
    setCurrentView('antiCherryPicker');
  };

  const handleOpenRevenueSource = (earning: any) => {
    setSelectedEarning(earning);
    setCurrentView('revenueSource');
  };

  // 2026-08-22 — DataLinkPromptStep(마이데이터 연동 유도)을 거치지 않고 설문으로 직행한다.
  // 그 화면은 1.5초 setTimeout 뒤 「연동완료」 배지만 띄우고 DB 에 아무것도 쓰지 않았다.
  // 게다가 onConnectAll 과 onSkip 이 같은 함수를 가리켜 「연동하기」와 「나중에」의
  // 결과가 완전히 같았다 — 지나가는 것 자체가 무의미한 절차였다.
  // B-44 에서 "서버는 grant_verification_reward 로 100 VN 고정 지급, isFullyLinked
  // 분기가 없다"가 이미 확정돼 있어 연동 여부는 보상에도 영향이 없다. 백로그 B-92.
  const handleStartSurvey = () => {
    setCurrentView('antiCherryPicker');
  };

  // 내부 View 렌더링
  const renderInternalView = () => {
    switch (currentView) {

      case 'antiCherryPicker':
        return (
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <AntiCherryPickerSurveyView
              onBack={handleBackToMain}
              onComplete={handleBackToMain}
              surveyId={activeSurveyId ?? dbSurveyId}
              onGoToEarn={() => { setActiveTab("earn"); setCurrentView("main"); setActiveSurveyId(undefined); }}
            />
          </Suspense>
        );
      case 'dataPortfolio':
        return (
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <DataPortfolioView onBack={handleBackToMain} />
          </Suspense>
        );
      case 'vcoreAnonymization':
        return (
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <VCoreAnonymizationView onBack={handleBackToMain} />
          </Suspense>
        );
      case 'partnerRevenue':
        return (
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <PartnerRevenueDashboard onBack={handleBackToMain} />
          </Suspense>
        );
      case 'revenueSource':
        return selectedEarning ? (
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <RevenueSourceView
              earning={selectedEarning}
              onBack={handleBackToMain}
            />
          </Suspense>
        ) : null;
      case 'unifiedPortfolio':
        return (
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <UnifiedPortfolioView onBack={handleBackToMain} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  if (currentView !== 'main') {
    return renderInternalView();
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <SupplierHomeTab
            trustScore={trustScore}
            vnBalance={vnBalance}
            displayName={displayName}
            isVerified={isVerified}
            onStartVerification={handleStartSurvey}   // AI 인증 설문으로 직행 (2026-08-22)
            onOpenWallet={() => setActiveTab("wallet")}  // B-36: VN 카드 → 내 지갑 탭 (포트폴리오 진입 숨김)
            onGoToEarn={() => setActiveTab("earn")}   // 홈 주 CTA → 수익 쌓기 탭(설문 목록)
          />
        );
      case "earn":
        return (
          <SupplierEarnTab
            trustScore={trustScore}
            isVerified={isVerified}
            onStartSurvey={handleStartDbSurvey}       // ✅ 구간②: surveyId 로 DB 설문 진입
            onEarnPoints={handleEarnPoints}
          />
        );
      case "wallet":
        return (
          <SupplierWalletTab
            vnBalance={vnBalance}
            trustScore={trustScore}
            displayName={displayName}
            isVerified={isVerified}
          />
        );
      case "settings":
        return (
          <SupplierSettingsTab
            displayName={displayName}
            email={user?.email || ""}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QuickMenu
                displayName={displayName}
                trustScore={trustScore}
                vnBalance={vnBalance}
              />
              <VeriNodeLogo />
            </div>
            <div className="flex items-center gap-3">
              {/* 2026-08-22 — 「기업 공급자 전환 →」 버튼 제거. 도착하는 수요자 화면
                  7개가 실데이터에 연결되지 않은 더미다(총 구매액·품질등급·상품목록·
                  구매내역·정산비율 전부 상수, supabase 호출 0건). 백로그 B-90·B-93.
                  Index.tsx 가 onSwitchToDemand 를 넘기지 않아 이 자리는 비어 있다. */}
              <NotificationCenter />
            </div>
          </div>

          {activeTab === "home" && (
            <div className="mt-3">
              <TrustScoreHeader
                score={trustScore}
                maxScore={100}
                showCelebration={showCelebration}
                earnedPoints={lastEarnedPoints}
              />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24 overflow-y-auto bg-secondary/30">
        {renderTabContent()}
      </main>

      {/* Bottom Navigation */}
      <SupplierBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default SupplierLayout;
