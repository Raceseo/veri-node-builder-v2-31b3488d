import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, ChevronRight, AlertTriangle, CheckCircle2, Link2, Building2, Landmark, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataSource {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  bonusVN: number;
  dataPoints: string[];
  color: string;
  connected: boolean;
}

interface DataLinkPromptStepProps {
  baseReward?: number;
  onConnectAll: () => void;   // 연동 완료 → 자동 설문 완성
  onSkip: () => void;         // 나중에 → 기본 설문 5문항
}

const DataLinkPromptStep = ({
  baseReward = 500,
  onConnectAll,
  onSkip,
}: DataLinkPromptStepProps) => {
  const [connected, setConnected] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const dataSources: DataSource[] = [
    {
      id: "mydata_finance",
      icon: <CreditCard className="w-5 h-5" />,
      name: "금융 마이데이터",
      description: "은행·카드·증권 거래 내역",
      bonusVN: 2000,
      dataPoints: ["소비 패턴", "금융 행동", "자산 현황"],
      color: "#3182F6",
      connected: false,
    },
    {
      id: "mydata_gov",
      icon: <Landmark className="w-5 h-5" />,
      name: "정부24 데이터",
      description: "주민등록·건강보험·세금 정보",
      bonusVN: 1500,
      dataPoints: ["인구 통계", "소득 수준", "건강 정보"],
      color: "#22C55E",
      connected: false,
    },
    {
      id: "mydata_telecom",
      icon: <Building2 className="w-5 h-5" />,
      name: "통신 마이데이터",
      description: "통신사 이용 패턴·요금 정보",
      bonusVN: 1000,
      dataPoints: ["생활 패턴", "위치 정보", "앱 사용"],
      color: "#F5A623",
      connected: false,
    },
  ];

  const totalBonusVN = dataSources
    .filter(s => connected.includes(s.id))
    .reduce((sum, s) => sum + s.bonusVN, 0);

  const totalReward = baseReward + totalBonusVN;
  const allConnected = dataSources.every(s => connected.includes(s.id));

  const handleConnect = async (sourceId: string) => {
    if (connected.includes(sourceId) || connecting) return;
    setConnecting(sourceId);
    // 실제로는 OAuth 팝업 → 마이데이터 API 연동
    await new Promise(res => setTimeout(res, 1500));
    setConnected(prev => [...prev, sourceId]);
    setConnecting(null);
  };

  const connectedCount = connected.length;
  const rewardMultiplier = connectedCount === 0 ? 1 : connectedCount === 1 ? 2 : connectedCount === 2 ? 3 : 5;

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* ── 상단 헤더 ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-[#1e2d45] bg-[#111827] p-5 text-center space-y-2"
      >
        <div className="w-12 h-12 rounded-full bg-blue-500/10 border-2 border-blue-500/25 flex items-center justify-center mx-auto text-xl">
          🔗
        </div>
        <h2 className="text-white text-lg font-extrabold tracking-tight">
          데이터를 연동하면 더 빠르고 더 많이 받아요
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          직접 타이핑 대신 내 데이터를 연동하면<br />
          <span className="text-white font-semibold">설문이 자동 완성</span>되고 보상도 최대 <span className="text-yellow-400 font-bold">5배</span> 증가해요
        </p>
      </motion.div>

      {/* ── 보상 비교 카드 ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* 연동 안 함 */}
        <div className="rounded-xl border border-[#1e2d45] bg-[#0d1626] p-4 space-y-1.5 opacity-60">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400 text-xs font-semibold">연동 안 함</span>
          </div>
          <p className="text-slate-300 text-xl font-black">+{baseReward.toLocaleString()} VN</p>
          <p className="text-slate-500 text-xs">5문항 직접 타이핑</p>
          <p className="text-slate-600 text-[10px]">데이터 등급 0점 유지</p>
        </div>
        {/* 전체 연동 */}
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-1.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
            추천
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-semibold">전체 연동</span>
          </div>
          <p className="text-yellow-400 text-xl font-black">
            +{(baseReward + dataSources.reduce((s, d) => s + d.bonusVN, 0)).toLocaleString()} VN
          </p>
          <p className="text-yellow-400/70 text-xs">자동 완성 · 즉시 완료</p>
          <p className="text-yellow-400/50 text-[10px]">데이터 등급 즉시 상승 ↑</p>
        </div>
      </motion.div>

      {/* ── 현재 예상 보상 실시간 표시 ───────────────────────────── */}
      <motion.div
        className="rounded-xl border border-[#1e2d45] bg-[#111827] px-4 py-3 flex items-center justify-between"
        animate={{ borderColor: totalBonusVN > 0 ? "rgba(245,166,35,0.4)" : "#1e2d45" }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#3182F6]" />
          <span className="text-slate-400 text-sm">현재 예상 보상</span>
        </div>
        <div className="flex items-center gap-2">
          {connectedCount > 0 && (
            <span className="text-xs bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
              {rewardMultiplier}배 보상
            </span>
          )}
          <motion.span
            key={totalReward}
            initial={{ scale: 1.2, color: "#F5A623" }}
            animate={{ scale: 1, color: totalBonusVN > 0 ? "#F5A623" : "#94a3b8" }}
            className="text-lg font-extrabold"
          >
            +{totalReward.toLocaleString()} VN
          </motion.span>
        </div>
      </motion.div>

      {/* ── 데이터 소스 목록 ──────────────────────────────────────── */}
      <div className="space-y-2.5">
        {dataSources.map((source, i) => {
          const isConnected = connected.includes(source.id);
          const isConnecting = connecting === source.id;

          return (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.08 }}
              className={`rounded-2xl border p-4 transition-all duration-300 ${
                isConnected
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-[#1e2d45] bg-[#111827]"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 아이콘 */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${source.color}18`, color: source.color }}
                >
                  {source.icon}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white text-sm font-bold">{source.name}</span>
                    {isConnected && (
                      <span className="text-green-400 text-[10px] font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> 연동완료
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">{source.description}</p>
                  {/* 데이터 포인트 태그 */}
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {source.dataPoints.map(point => (
                      <span
                        key={point}
                        className="text-[10px] px-1.5 py-0.5 rounded-md"
                        style={{ background: `${source.color}15`, color: source.color }}
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 보상 + 버튼 */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-yellow-400 text-sm font-black">
                    +{source.bonusVN.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleConnect(source.id)}
                    disabled={isConnected || !!connecting}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isConnected
                        ? "bg-green-500/15 text-green-400 cursor-default"
                        : isConnecting
                        ? "bg-blue-500/15 text-blue-400 cursor-wait"
                        : "text-white cursor-pointer hover:-translate-y-0.5"
                    }`}
                    style={
                      !isConnected && !isConnecting
                        ? {
                            background: `linear-gradient(135deg, ${source.color}, ${source.color}cc)`,
                            boxShadow: `0 4px 12px ${source.color}40`,
                          }
                        : {}
                    }
                  >
                    {isConnected ? (
                      <><CheckCircle2 className="w-3 h-3" /> 완료</>
                    ) : isConnecting ? (
                      <><motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full"
                      /> 연동중...</>
                    ) : (
                      <><Link2 className="w-3 h-3" /> 연동하기</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── 하단 버튼 영역 ────────────────────────────────────────── */}
      <div className="space-y-2.5 pt-1">

        {/* 전체 연동 완료 버튼 */}
        <AnimatePresence>
          {allConnected && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <Button
                onClick={onConnectAll}
                className="w-full h-13 rounded-xl text-base font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #22C55E, #16a34a)",
                  boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
                }}
              >
                🎉 연동 완료! 자동 설문 완성하기 (+{totalReward.toLocaleString()} VN)
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 일부 연동 후 진행 */}
        {connectedCount > 0 && !allConnected && (
          <Button
            onClick={onConnectAll}
            className="w-full h-12 rounded-xl text-sm font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #3182F6, #1a6fd4)",
              boxShadow: "0 8px 24px rgba(49,130,246,0.3)",
            }}
          >
            연동된 데이터로 설문 시작하기 (+{totalReward.toLocaleString()} VN) →
          </Button>
        )}

        {/* 나중에 하기 */}
        <button
          onClick={onSkip}
          className="w-full py-3.5 rounded-xl border border-[#1e2d45] text-slate-500 text-sm font-medium hover:text-slate-300 hover:border-slate-600 transition-all duration-200"
        >
          나중에 연동할게요 &nbsp;·&nbsp;
          <span className="text-slate-600">기본 설문만 참여 (+{baseReward.toLocaleString()} VN)</span>
        </button>

        {/* 손실 프레이밍 */}
        {connectedCount === 0 && (
          <p className="text-center text-xs text-slate-600 leading-relaxed">
            ⚠️ 연동하지 않으면 데이터 등급이 <span className="text-red-400 font-semibold">0점</span>으로 유지되며,
            향후 고가치 설문 참여가 제한될 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
};

export default DataLinkPromptStep;
