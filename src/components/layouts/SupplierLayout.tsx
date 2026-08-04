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

// ✅ DataLinkPromptStep 추가 (마이데이터 연동 유도 화면)
import DataLinkPromptStep from "@/components/verification/DataLinkPromptStep";

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
const MyDataUploadView = lazy(() => import("@/components/views/MyDataUploadView"));
const DataCategoryMonitorView = lazy(() => import("@/components/views/DataCategoryMonitorView"));
const ConsumptionReportView = lazy(() => import("@/components/views/ConsumptionReportView"));
const RevenueSourceView = lazy(() => import("@/components/views/RevenueSourceView"));
const UnifiedPortfolioView = lazy(() => import("@/components/views/UnifiedPortfolioView"));

type InternalView =
  | 'main'
  | 'dataLinkPrompt'      // ✅ 새로 추가: 마이데이터 연동 유도 화면
  | 'antiCherryPicker'
  | 'dataPortfolio'
  | 'vcoreAnonymization'
  | 'partnerRevenue'
  | 'myDataUpload'
  | 'dataCategoryMonitor'
  | 'consumptionReport'
  | 'revenueSource'
  | 'unifiedPortfolio';

interface SupplierLayoutProps {
  onSwitchToDemand?: () => void;
}

const SupplierLayout = ({ onSwitchToDemand }: SupplierLayoutProps) => {
  const { user } = useAuth();
  const { trustScore, vnBalance, displayName, isVerified } = useProfileContext();
  const [activeTab, setActiveTab] = useState<SupplierTabType>("home");
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastEarnedPoints, setLastEarnedPoints] = useState(0);

  // ✅ DB 설문 딥링크: URL 에 ?surveyId=<uuid> 가 있으면 AntiCherryPicker 를 DB 설문 모드로 바로 진입.
  //    (연동 유도 화면 dataLinkPrompt 는 건너뜀 — DB 설문 모드는 마이데이터 자동완성을 쓰지 않으므로.)
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

  const handleSwitchToDemand = () => {
    toast.info("기업 모드로 전환 중...", {
      duration: 1500,
      icon: "🔄",
    });
    setTimeout(() => {
      onSwitchToDemand?.();
    }, 1500);
  };

  // ✅ 설문 시작 시 DataLinkPromptStep 먼저 표시
  const handleStartSurvey = () => {
    setCurrentView('dataLinkPrompt');
  };

  // ✅ 마이데이터 연동 완료 or 건너뛰기 → 실제 설문으로 이동
  const handleProceedToSurvey = () => {
    setCurrentView('antiCherryPicker');
  };

  // 내부 View 렌더링
  const renderInternalView = () => {
    switch (currentView) {

      // ✅ 마이데이터 연동 유도 화면 (새로 추가)
      case 'dataLinkPrompt':
        return (
          <div className="min-h-screen bg-[#0a0f1a] px-4 py-6">
            <div className="max-w-xl mx-auto">
              {/* 뒤로가기 버튼 */}
              <button
                onClick={handleBackToMain}
                className="flex items-center gap-1.5 text-slate-500 text-sm mb-6 hover:text-slate-300 transition-colors"
              >
                ← 돌아가기
              </button>
              <DataLinkPromptStep
                baseReward={500}
                onConnectAll={handleProceedToSurvey}
                onSkip={handleProceedToSurvey}
              />
            </div>
          </div>
        );

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
      case 'myDataUpload':
        return (
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <MyDataUploadView onBack={handleBackToMain} />
          </Suspense>
        );
      case 'dataCategoryMonitor':
        return (
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <DataCategoryMonitorView onBack={handleBackToMain} />
          </Suspense>
        );
      case 'consumptionReport':
        return (
          <Suspense fallback={<LoadingSpinner fullScreen={false} />}>
            <ConsumptionReportView onBack={handleBackToMain} />
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
            onStartVerification={handleStartSurvey}   // ✅ DataLinkPromptStep 먼저
            onOpenPortfolio={() => setCurrentView("dataPortfolio")}
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
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QuickMenu
                displayName={displayName}
                trustScore={trustScore}
                vnBalance={vnBalance}
                onOpenMyDataUpload={() => setCurrentView("myDataUpload")}
                onOpenCategoryMonitor={() => setCurrentView("dataCategoryMonitor")}
                onOpenConsumptionReport={() => setCurrentView("consumptionReport")}
              />
              <VeriNodeLogo />
            </div>
            <div className="flex items-center gap-3">
              {onSwitchToDemand && (
                <button
                  onClick={handleSwitchToDemand}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-navy/10 hover:bg-navy/20 rounded-full text-xs font-medium text-navy transition-all"
                >
                  <span>기업 공급자 전환</span>
                  <span className="text-[10px]">→</span>
                </button>
              )}
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
