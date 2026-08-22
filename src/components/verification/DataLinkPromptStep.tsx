/**
 * 🔴 2026-08-22 — 진입점 차단. 되살리기 전에 반드시 읽을 것.
 *
 * **가짜 연동이다.** handleConnect(:64)는 1.5초 setTimeout 뒤 로컬 상태만 바꾼다.
 * 「연동완료」 배지가 뜨지만 DB 에 아무것도 쓰지 않는다.
 * 대상 3개 — 금융 마이데이터 / 정부24 데이터(주민등록·건강보험·세금) / 통신 마이데이터.
 *
 * 🔴 더 근본적인 문제: 부모(SupplierLayout)가 onConnectAll 과 onSkip 에
 *    **같은 함수(handleProceedToSurvey)** 를 넘기고 있었다. 「연동하기」를 다 눌러도
 *    「나중에」를 눌러도 결과가 완전히 같았다.
 *    B-44 에서 "서버는 grant_verification_reward 로 100 VN 고정 지급, isFullyLinked
 *    분기가 없다"가 확정돼 보상에도 영향이 없다 — 지나가는 것 자체가 무의미한 절차였다.
 *
 * 되살릴 때: OAuth → 마이데이터 API 실동작을 먼저 구현한다.
 * 연동 결과가 무언가를 바꾸지 않는다면 화면을 되살릴 이유가 없다.
 *
 * 백로그 B-92.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Link2, Building2, Landmark, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

// B-44: 배수 보상 약속(비교 카드·N배 배지·실시간 예상 보상·버튼 금액·소스별 보너스)을
//   통째로 제거했다. 서버는 grant_verification_reward 로 100 VN 을 고정 지급하며
//   isFullyLinked 분기가 없다(Ray 확정 2항). 화면이 최대 5,000 VN 을 약속하고 있었다.
//   연동 화면 자체의 존폐는 B-28 소관이므로, 여기서는 지킬 수 없는 약속만 걷어낸다.
interface DataSource {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  dataPoints: string[];
  color: string;
  connected: boolean;
}

interface DataLinkPromptStepProps {
  onConnectAll: () => void;   // 연동 완료 → 자동 설문 완성
  onSkip: () => void;         // 나중에 → 기본 설문 5문항
}

const DataLinkPromptStep = ({
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
      dataPoints: ["소비 패턴", "금융 행동", "자산 현황"],
      color: "#3182F6",
      connected: false,
    },
    {
      id: "mydata_gov",
      icon: <Landmark className="w-5 h-5" />,
      name: "정부24 데이터",
      description: "주민등록·건강보험·세금 정보",
      dataPoints: ["인구 통계", "소득 수준", "건강 정보"],
      color: "#22C55E",
      connected: false,
    },
    {
      id: "mydata_telecom",
      icon: <Building2 className="w-5 h-5" />,
      name: "통신 마이데이터",
      description: "통신사 이용 패턴·요금 정보",
      dataPoints: ["생활 패턴", "위치 정보", "앱 사용"],
      color: "#F5A623",
      connected: false,
    },
  ];

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
          데이터를 연동하면 입력이 줄어요
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          직접 타이핑 대신 내 데이터를 연동하면<br />
          <span className="text-white font-semibold">설문이 자동 완성</span>됩니다
        </p>
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

                {/* 연동 버튼 */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
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
                🎉 연동 완료! 자동 설문 완성하기
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
            연동된 데이터로 설문 시작하기 →
          </Button>
        )}

        {/* 나중에 하기 */}
        <button
          onClick={onSkip}
          className="w-full py-3.5 rounded-xl border border-[#1e2d45] text-slate-500 text-sm font-medium hover:text-slate-300 hover:border-slate-600 transition-all duration-200"
        >
          나중에 연동할게요 &nbsp;·&nbsp;
          <span className="text-slate-600">직접 입력으로 참여</span>
        </button>

        {/* B-44: 손실 프레이밍 제거 — "데이터 등급 0점 유지"는 B-28 에서 "데이터 등급"의
            정의가 없다고 판정했고, "향후 고가치 설문 참여 제한"은 서버에 그런 기제가 없다. */}
      </div>
    </div>
  );
};

export default DataLinkPromptStep;
