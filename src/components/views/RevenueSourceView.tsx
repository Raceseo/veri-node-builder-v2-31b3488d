import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  Receipt, 
  Sparkles,
  CheckCircle2,
  Shield,
  TrendingUp,
  Coins,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RevenueSourceViewProps {
  earning: {
    id: number;
    title: string;
    amount: number;
    date: string;
  };
  onBack: () => void;
}

export const RevenueSourceView = ({ earning, onBack }: RevenueSourceViewProps) => {
  // Sample matching data - would come from API in real app
  const matchingData = {
    institution: "OO대학교 정책 연구소",
    reportTitle: "2025 IT 인력 분석",
    dataTypes: ["직무 데이터", "경력 정보", "급여 범위"],
    totalSales: 125000,
    contributorCount: 25,
    yourContribution: 5000,
    contributionRate: 4,
    matchedAt: "2024.12.18 14:32",
    verifiedAt: "2024.12.18 14:35"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 bg-slate-950/90 backdrop-blur-xl border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">수익 출처 상세</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Earning Summary Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-0 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              수익 확정
            </Badge>
            <span className="text-sm text-white/50">{earning.date}</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{earning.title}</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400">+₩{earning.amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Matching Details Section */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white">매칭 내역</h3>
          </div>
          
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
            <p className="text-white/90 leading-relaxed">
              나의 <span className="text-indigo-300 font-semibold">직무 데이터</span>가{" "}
              <span className="text-amber-300 font-semibold">{matchingData.institution}</span>의{" "}
              <span className="text-cyan-300 font-semibold">[{matchingData.reportTitle}]</span>{" "}
              리포트에 활용되었습니다.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">활용된 데이터</span>
              <div className="flex gap-2">
                {matchingData.dataTypes.map((type, index) => (
                  <Badge key={index} className="bg-indigo-500/20 text-indigo-300 border-0 text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">매칭 시간</span>
              <span className="text-white/80">{matchingData.matchedAt}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">검증 완료</span>
              <span className="text-emerald-400">{matchingData.verifiedAt}</span>
            </div>
          </div>
        </div>

        {/* Revenue Receipt Section */}
        <div className="relative p-5 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          {/* Receipt decoration */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20" />
          
          <div className="flex items-center gap-2 mb-4 mt-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white">정직한 영수증</h3>
          </div>

          {/* Receipt Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/30 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-4 pb-4 border-b border-dashed border-white/20">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="text-amber-300 font-semibold">VeriNode 수익 배분 영수증</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">리포트 전체 판매 금액</span>
                <span className="text-white font-medium">₩{matchingData.totalSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">참여 데이터 제공자 수</span>
                <span className="text-white font-medium">{matchingData.contributorCount}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">나의 기여율</span>
                <span className="text-indigo-300 font-medium">{matchingData.contributionRate}%</span>
              </div>
              
              <div className="pt-3 mt-3 border-t border-dashed border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 font-medium">나의 데이터 기여분</span>
                  <span className="text-2xl font-bold text-emerald-400">₩{matchingData.yourContribution.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Stamp decoration */}
            <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full border-2 border-amber-500/40 flex items-center justify-center rotate-[-15deg] opacity-60">
              <div className="text-center">
                <CheckCircle2 className="w-6 h-6 text-amber-400 mx-auto" />
                <span className="text-[8px] text-amber-400 font-bold">VERIFIED</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/40 text-center mt-3">
            전체 판매 금액 중 당신의 데이터 기여분 ₩{matchingData.yourContribution.toLocaleString()}이 배분되었습니다
          </p>
        </div>

        {/* Important Notice */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-emerald-200 font-semibold text-sm mb-1">
                실질 수익 안내
              </p>
              <p className="text-emerald-300/80 text-sm leading-relaxed">
                이 수익은 <span className="text-amber-300 font-semibold">친구 초대 보너스가 아닌</span>, 
                당신의 <span className="text-white font-semibold">데이터 가치로 창출된 실질 수익</span>입니다.
              </p>
            </div>
          </div>
        </div>

        {/* Data Value Breakdown */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white">데이터 가치 분석</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">직무 정보 가치</p>
                <p className="text-xs text-white/50">IT 개발자 · 5년차</p>
              </div>
              <span className="text-indigo-300 font-semibold">₩3,000</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">급여 데이터 가치</p>
                <p className="text-xs text-white/50">연봉 범위 정보</p>
              </div>
              <span className="text-violet-300 font-semibold">₩2,000</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-white/70">총 배분 금액</span>
            <span className="text-xl font-bold text-emerald-400">₩{matchingData.yourContribution.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
            onClick={onBack}
          >
            확인
          </Button>
          <Button 
            variant="outline"
            className="h-12 px-6 border-white/20 text-white hover:bg-white/10 rounded-xl"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            문의
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RevenueSourceView;
