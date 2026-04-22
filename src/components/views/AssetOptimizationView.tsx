import { useState } from "react";
import { 
  ArrowLeft, TrendingUp, Gem, Scale, ArrowRight, 
  Sparkles, AlertTriangle, ChevronRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface AssetOptimizationViewProps {
  onBack: () => void;
}

interface RareData {
  id: string;
  category: string;
  name: string;
  scarcity: number;
  multiplier: number;
  supply: number;
  demand: number;
}

interface SynergySimulation {
  currentValue: number;
  potentialValue: number;
  addedCategory: string;
  multiplier: number;
}

const AssetOptimizationView = ({ onBack }: AssetOptimizationViewProps) => {
  const [selectedSimulation, setSelectedSimulation] = useState<string | null>(null);
  const [balanceScore] = useState(45);

  // 희귀 데이터 TOP 3
  const rareDataList: RareData[] = [
    {
      id: "1",
      category: "주거",
      name: "주거 형태 데이터",
      scarcity: 92,
      multiplier: 2.5,
      supply: 1250,
      demand: 8400,
    },
    {
      id: "2",
      category: "자산",
      name: "금융자산 현황 데이터",
      scarcity: 85,
      multiplier: 2.2,
      supply: 2100,
      demand: 9200,
    },
    {
      id: "3",
      category: "건강",
      name: "의료기록 데이터",
      scarcity: 78,
      multiplier: 1.8,
      supply: 3500,
      demand: 8700,
    },
  ];

  // 시너지 시뮬레이션 데이터
  const synergySimulations: SynergySimulation[] = [
    { currentValue: 100, potentialValue: 500, addedCategory: "주거", multiplier: 5.0 },
    { currentValue: 100, potentialValue: 380, addedCategory: "자산", multiplier: 3.8 },
    { currentValue: 100, potentialValue: 250, addedCategory: "건강", multiplier: 2.5 },
  ];

  // 현재 보유 데이터 현황
  const myData = [
    { category: "소비", value: 100, hasData: true },
    { category: "동선", value: 80, hasData: true },
    { category: "학력", value: 60, hasData: true },
    { category: "주거", value: 0, hasData: false },
    { category: "자산", value: 0, hasData: false },
    { category: "건강", value: 0, hasData: false },
  ];

  const getScarcityColor = (scarcity: number) => {
    if (scarcity >= 90) return "text-rose-400";
    if (scarcity >= 80) return "text-amber-400";
    return "text-blue-400";
  };

  const getScarcityBg = (scarcity: number) => {
    if (scarcity >= 90) return "bg-rose-500/10 border-rose-500/30";
    if (scarcity >= 80) return "bg-amber-500/10 border-amber-500/30";
    return "bg-blue-500/10 border-blue-500/30";
  };

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <div className="bg-slate-50 px-4 pt-10 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <p className="text-slate-500 text-xs font-mono tracking-wide">ASSET OPTIMIZATION</p>
            <h1 className="text-lg font-bold text-slate-900">데이터 자산 가치 최적화</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* 포트폴리오 균형 지수 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-slate-900">포트폴리오 균형 지수</h2>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-600">데이터 균형도</span>
            <span className={`text-2xl font-bold font-mono ${
              balanceScore >= 80 ? 'text-emerald-600' : 
              balanceScore >= 50 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {balanceScore}%
            </span>
          </div>

          <div className="h-3 rounded-full bg-slate-100 overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${balanceScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                balanceScore >= 80 ? 'bg-emerald-500' : 
                balanceScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              균형도가 <span className="font-bold">80% 이상</span>일 때 모든 데이터 정산율이 
              <span className="font-bold text-blue-900"> 1.2배 상승</span>합니다.
            </p>
          </div>

          {/* 현재 보유 데이터 현황 */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3">현재 보유 데이터</p>
            <div className="grid grid-cols-6 gap-2">
              {myData.map((item) => (
                <div 
                  key={item.category}
                  className={`text-center p-2 rounded-lg ${
                    item.hasData 
                      ? 'bg-slate-100 border border-slate-200' 
                      : 'bg-slate-50 border border-dashed border-slate-300'
                  }`}
                >
                  <p className={`text-[10px] font-medium ${
                    item.hasData ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {item.category}
                  </p>
                  <p className={`text-xs font-mono mt-1 ${
                    item.hasData ? 'text-slate-900' : 'text-slate-300'
                  }`}>
                    {item.hasData ? item.value : '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 희귀 데이터 시세판 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gem className="w-5 h-5 text-slate-700" />
              <h2 className="font-bold text-slate-900">희귀 데이터 시세판</h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">실시간 TOP 3</span>
          </div>

          <div className="space-y-3">
            {rareDataList.map((data, index) => (
              <motion.div
                key={data.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`p-4 rounded-xl border ${getScarcityBg(data.scarcity)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold font-mono ${getScarcityColor(data.scarcity)}`}>
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{data.name}</p>
                      <p className="text-xs text-slate-500">{data.category} 카테고리</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-bold font-mono ${getScarcityColor(data.scarcity)}`}>
                      ×{data.multiplier.toFixed(1)}
                    </span>
                    <p className="text-[10px] text-slate-500">보상 배율</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-500">희소성</span>
                      <span className={`ml-2 font-mono font-bold ${getScarcityColor(data.scarcity)}`}>
                        {data.scarcity}%
                      </span>
                    </div>
                    <div className="text-slate-400">|</div>
                    <div>
                      <span className="text-slate-500">공급</span>
                      <span className="ml-2 font-mono text-slate-700">{data.supply.toLocaleString()}</span>
                    </div>
                    <div className="text-slate-400">|</div>
                    <div>
                      <span className="text-slate-500">수요</span>
                      <span className="ml-2 font-mono text-slate-700">{data.demand.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 실시간 희소성 알림 */}
          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-700 leading-relaxed">
                현재 시장에 <span className="font-bold text-slate-900">주거 데이터</span>가 부족하여 
                보상 가중치가 <span className="font-bold text-amber-600">2.5배</span> 적용 중입니다.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 데이터 시너지 시뮬레이터 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-slate-900">데이터 시너지 시뮬레이터</h2>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            현재 소비 데이터의 가치: <span className="font-mono font-bold text-slate-900">100원</span>
          </p>

          <div className="space-y-3">
            {synergySimulations.map((sim, index) => (
              <motion.button
                key={sim.addedCategory}
                onClick={() => setSelectedSimulation(
                  selectedSimulation === sim.addedCategory ? null : sim.addedCategory
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedSimulation === sim.addedCategory
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedSimulation === sim.addedCategory
                        ? 'bg-white/10'
                        : 'bg-slate-200'
                    }`}>
                      <TrendingUp className={`w-5 h-5 ${
                        selectedSimulation === sim.addedCategory
                          ? 'text-emerald-400'
                          : 'text-slate-600'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${
                        selectedSimulation === sim.addedCategory
                          ? 'text-white'
                          : 'text-slate-900'
                      }`}>
                        + {sim.addedCategory} 데이터 추가 시
                      </p>
                      <p className={`text-xs ${
                        selectedSimulation === sim.addedCategory
                          ? 'text-slate-400'
                          : 'text-slate-500'
                      }`}>
                        패키지 시너지 적용
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${
                    selectedSimulation === sim.addedCategory
                      ? 'text-white rotate-90'
                      : 'text-slate-400'
                  }`} />
                </div>

                {selectedSimulation === sim.addedCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-slate-700"
                  >
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">현재 가치</p>
                        <p className="text-xl font-bold font-mono text-slate-300">
                          {sim.currentValue}원
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-6 h-6 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-bold">
                          ×{sim.multiplier}
                        </span>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xs text-slate-400 mb-1">예상 가치</p>
                        <p className="text-2xl font-bold font-mono text-emerald-400">
                          {sim.potentialValue}원
                        </p>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      {sim.addedCategory} 데이터 연동하기
                    </Button>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 최적화 요약 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 rounded-xl p-5"
        >
          <h3 className="text-white font-bold mb-3">📊 최적화 분석 요약</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">현재 포트폴리오 가치</span>
              <span className="text-white font-mono font-bold">240원</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">주거 데이터 추가 시</span>
              <span className="text-emerald-400 font-mono font-bold">+260원 (×2.1)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">균형도 80% 달성 시</span>
              <span className="text-blue-400 font-mono font-bold">+48원 (×1.2)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-white font-bold">최대 예상 가치</span>
              <span className="text-amber-400 font-mono font-bold text-lg">548원</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AssetOptimizationView;
