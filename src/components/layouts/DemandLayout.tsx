/**
 * 🔴 **더미 화면. 실데이터 미연결 (B-90).**
 *    2026-08-22 진입점 차단 — 홈 헤더 「기업 공급자 전환 →」 버튼을 제거했다.
 *    Index.tsx 가 SupplierLayout 에 onSwitchToDemand 를 넘기지 않는다.
 *
 * 수요자 화면 7파일(1,805줄) 전부 `supabase.` 호출 0건이다.
 * 화면에 보이는 금액·등급·상품·구매내역·리포트가 모두 상수다.
 * 🔴 되살리기 전 목업 제거 필수 — 첫 의뢰 기업이 자기 것이 아닌 숫자를 보게 된다.
 * 이 파일의 목업: :52 totalPurchaseAmount = 12850000 (거래 0건인데 ₩12,850,000)
 *                :53 dataQualityGrade = "S" (·프리미엄 배지)
 */
import { useState, useEffect } from "react";
import DemandBottomNav, { DemandTabType } from "@/components/navigation/DemandBottomNav";
import DemandMarketTab from "@/components/tabs/demand/DemandMarketTab";
import DemandPurchasesTab from "@/components/tabs/demand/DemandPurchasesTab";
import DemandReportsTab from "@/components/tabs/demand/DemandReportsTab";
import DemandSettingsTab from "@/components/tabs/demand/DemandSettingsTab";
import { Building2, ShieldCheck, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RollingNumber from "@/components/animations/RollingNumber";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface DemandLayoutProps {
  companyName?: string;
  onSwitchToSupplier?: () => void;
  onLogout?: () => void;
  onOpenDataRequest?: () => void;
  onOpenSubscription?: () => void;
  onOpenPreferences?: () => void;
}

const DemandLayout = ({
  companyName = "ABC Corporation",
  onSwitchToSupplier,
  onLogout,
  onOpenDataRequest,
  onOpenSubscription,
  onOpenPreferences,
}: DemandLayoutProps) => {
  const [activeTab, setActiveTab] = useState<DemandTabType>("market");

  // 다크 모드 적용
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const handleSwitchToSupplier = () => {
    toast.info("보안 세션 연결 중...", {
      duration: 1500,
      icon: "🔐",
    });
    setTimeout(() => {
      onSwitchToSupplier?.();
    }, 1500);
  };

  // Mock KPI 데이터
  const totalPurchaseAmount = 12850000;
  const dataQualityGrade = "S";

  const renderContent = () => {
    switch (activeTab) {
      case "market":
        return (
          <DemandMarketTab 
            onOpenDataRequest={onOpenDataRequest}
            onOpenSubscription={onOpenSubscription}
          />
        );
      case "purchases":
        return <DemandPurchasesTab />;
      case "reports":
        return <DemandReportsTab />;
      case "settings":
        return (
          <DemandSettingsTab 
            companyName={companyName}
            onOpenPreferences={onOpenPreferences}
            onLogout={onLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-white">{companyName}</span>
                <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                  Enterprise
                </Badge>
              </div>
            </div>
            
            {/* 모드 스위치 */}
            {onSwitchToSupplier && (
              <button 
                onClick={handleSwitchToSupplier}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-medium text-white/80 transition-all"
              >
                <span>내 데이터 관리</span>
                <span className="text-[10px]">←</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI 위젯 */}
        {activeTab === "market" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-3"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* 총 구매액 */}
              <Card className="p-3 bg-slate-800/50 border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">총 구매액</span>
                </div>
                <p className="text-lg font-bold text-white">
                  <RollingNumber value={totalPurchaseAmount} prefix="₩" />
                </p>
              </Card>

              {/* 데이터 품질 등급 */}
              <Card className="p-3 bg-slate-800/50 border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-400">데이터 품질</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gold">{dataQualityGrade}</span>
                  <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                    프리미엄
                  </Badge>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {renderContent()}
      </main>

      {/* 하단 철학 문구 */}
      <div className="fixed bottom-16 left-0 right-0 text-center py-1 bg-slate-950/80 backdrop-blur-sm">
        <p className="text-[9px] text-slate-600 tracking-wide">
          데이터 주인은 나, 무상 제공 금지 • VeriNode
        </p>
      </div>

      {/* Bottom Navigation */}
      <DemandBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default DemandLayout;
