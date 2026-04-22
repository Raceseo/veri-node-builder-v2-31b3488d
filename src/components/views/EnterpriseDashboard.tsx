import { useState } from "react";
import { 
  Building2, ShieldCheck, BarChart3, FileCheck, 
  ChevronRight, TrendingUp, Lock, Database,
  FileSearch, AlertTriangle, Download, Eye, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface EnterpriseDashboardProps {
  companyName?: string;
  vnBalance?: number;
  onOpenMarketplace?: () => void;
  onOpenSecurityReport?: () => void;
  onOpenDataQuality?: () => void;
  onOpenSubscription?: () => void;
  onOpenWinWin?: () => void;
  onOpenDataHub?: () => void;
}

const EnterpriseDashboard = ({
  companyName = "ACME Corp",
  vnBalance = 125000,
  onOpenMarketplace,
  onOpenSecurityReport,
  onOpenDataQuality,
  onOpenSubscription,
  onOpenWinWin,
  onOpenDataHub
}: EnterpriseDashboardProps) => {
  const securityMetrics = {
    gdprCompliance: 98,
    dataIntegrity: 100,
    anonymization: 99,
  };

  const recentPurchases = [
    { id: 1, title: "2024 소비자 트렌드 데이터셋", samples: 15000, date: "오늘", status: "완료" },
    { id: 2, title: "금융 서비스 만족도 리포트", samples: 8500, date: "어제", status: "처리중" },
    { id: 3, title: "Z세대 라이프스타일 조사", samples: 12000, date: "3일 전", status: "완료" },
  ];

  const recommendedDatasets = [
    { id: 1, title: "2024 MZ세대 소비패턴", purity: 98.5, samples: 25000, price: 5000 },
    { id: 2, title: "헬스케어 인식 조사", purity: 97.2, samples: 18000, price: 3500 },
    { id: 3, title: "디지털 금융 사용 현황", purity: 99.1, samples: 22000, price: 4800 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-dark to-slate-950 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 pt-12 pb-8 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-400 text-sm">Enterprise Dashboard</p>
            <h1 className="text-2xl font-bold text-white">{companyName}</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* VN Token Balance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-sm">보유 VN 토큰</span>
              <p className="text-3xl font-bold text-white">{vnBalance.toLocaleString()} VN</p>
            </div>
            <Button 
              variant="outline" 
              className="border-trust text-trust hover:bg-trust/10"
            >
              충전하기
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="px-6 -mt-4">
        {/* Security Report Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 mb-4 mt-8"
          onClick={onOpenSecurityReport}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">보안 리포트</h3>
                <p className="text-slate-400 text-sm">모든 규정 준수 확인됨</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">GDPR 준수</p>
              <div className="flex items-center gap-2">
                <Progress value={securityMetrics.gdprCompliance} className="h-1.5 flex-1" />
                <span className="text-sm text-emerald-400">{securityMetrics.gdprCompliance}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">데이터 무결성</p>
              <div className="flex items-center gap-2">
                <Progress value={securityMetrics.dataIntegrity} className="h-1.5 flex-1" />
                <span className="text-sm text-emerald-400">{securityMetrics.dataIntegrity}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">익명화 수준</p>
              <div className="flex items-center gap-2">
                <Progress value={securityMetrics.anonymization} className="h-1.5 flex-1" />
                <span className="text-sm text-emerald-400">{securityMetrics.anonymization}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Data Hub CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={onOpenDataHub}
          className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-2xl p-4 border border-primary/30 cursor-pointer hover:border-primary/50 transition-all mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">데이터 허브</h3>
                <p className="text-slate-400 text-sm">맞춤 추천 & 정기 구독 관리</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-3 mb-6"
        >
          <button 
            onClick={onOpenMarketplace}
            className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-trust/50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-trust/20 flex items-center justify-center mx-auto mb-2">
              <Database className="w-5 h-5 text-trust" />
            </div>
            <p className="text-xs text-white font-medium">마켓플레이스</p>
          </button>
          <button 
            onClick={onOpenDataQuality}
            className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-trust/50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
              <FileSearch className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-xs text-white font-medium">품질 리포트</p>
          </button>
          <button className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-trust/50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-xs text-white font-medium">분석 대시보드</p>
          </button>
          <button 
            onClick={onOpenWinWin}
            className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-emerald-500/50 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs text-white font-medium">Win-Win KPI</p>
          </button>
        </motion.div>

        {/* Recommended Datasets */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">추천 데이터셋</h2>
            <button onClick={onOpenMarketplace} className="text-sm text-trust font-medium">전체보기</button>
          </div>
          <div className="space-y-3">
            {recommendedDatasets.map((dataset) => (
              <div 
                key={dataset.id}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-trust/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{dataset.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">{dataset.samples.toLocaleString()} 샘플</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {dataset.purity}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-trust">{dataset.price.toLocaleString()} VN</p>
                    <Button size="sm" variant="outline" className="mt-1 text-xs border-trust text-trust hover:bg-trust/10">
                      구매하기
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Purchases */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">최근 구매 내역</h2>
            <button className="text-sm text-trust font-medium">전체보기</button>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/10">
            {recentPurchases.map((purchase) => (
              <div key={purchase.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-trust/20 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-trust" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{purchase.title}</p>
                    <p className="text-xs text-slate-400">{purchase.samples.toLocaleString()} 샘플 · {purchase.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    purchase.status === "완료" 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {purchase.status}
                  </span>
                  {purchase.status === "완료" && (
                    <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                      <Download className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Subscription CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onOpenSubscription}
          className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 rounded-2xl p-5 border border-amber-500/30 cursor-pointer hover:border-amber-400/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Enterprise Plans</h3>
                <p className="text-slate-400 text-sm">V-Core 프리미엄 구독으로 업그레이드</p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full font-bold">
                UPGRADE
              </span>
            </div>
          </div>
        </motion.div>

        {/* Compliance Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-6 border-t border-white/10"
        >
          <p className="text-xs text-slate-500 text-center mb-3">글로벌 규정 준수 인증</p>
          <div className="flex justify-center gap-4">
            <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-xs text-slate-400">GDPR</span>
            </div>
            <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-xs text-slate-400">ISO 27001</span>
            </div>
            <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-xs text-slate-400">CCPA</span>
            </div>
            <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-xs text-slate-400">HIPAA</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EnterpriseDashboard;
