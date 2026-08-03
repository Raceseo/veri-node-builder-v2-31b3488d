import {
  User, Building2, ArrowRight, Shield,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type UserType = "individual" | "enterprise" | null;

interface DualModeEntryViewProps {
  onComplete: (userType: UserType) => void;
}

const DualModeEntryView = ({ onComplete }: DualModeEntryViewProps) => {
  // I-1: 「본인 인증」(모형) 화면 제거 — 개인 선택 시 온보딩을 바로 완료한다.
  const handleSelectIndividual = () => {
    onComplete("individual");
  };

  // I-2: 「기업 인증」(모형) 화면 제거 — 사업자번호·NDA·인증배지 모두 검증·저장되지
  // 않는 껍데기였음. 기업 선택 시 온보딩을 바로 완료한다(개인과 동일 패턴).
  const handleSelectEnterprise = () => {
    onComplete("enterprise");
  };

  // Entry Selection Screen
  // B-22: 반응형 분기가 없어 휴대폰 세로에서도 좌우 분할이 강제됐다.
  //   360px 화면 기준 한쪽 콘텐츠 폭이 116px 뿐이라 문구가 4~6줄로 쪼개졌다.
  //   md(768px) 미만은 세로로 쌓고, 각 패널에 min-h-[50vh] 를 주어
  //   스크롤 없이 두 선택지가 한 화면에 들어오게 한다.
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Individual Side - Bright & Friendly */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 min-h-[50vh] md:min-h-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8 relative overflow-hidden cursor-pointer group"
        onClick={handleSelectIndividual}
      >
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-trust/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-trustTeal/10 rounded-full blur-3xl" />

        <motion.div
          className="relative z-10 text-center max-w-sm"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-trust to-trustTeal flex items-center justify-center mx-auto mb-6 shadow-lg shadow-trust/30 group-hover:shadow-xl group-hover:shadow-trust/40 transition-all">
            <User className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-4">개인</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            마이데이터로 내 가치를 증명하고<br/>
            <span className="text-trust font-semibold">정당한 보상</span>을 받으세요
          </p>

          {/* B-21: "데이터 신뢰 점수 2배 상승" 항목 삭제.
              무엇 대비 2배인지 근거가 없고(구간F에서 걷어낸 "보상 5배"와 동형),
              신뢰 점수가 실제로 적립되는지도 확인되지 않았다.
              확인 안 된 것을 다른 말로 바꿔 남기면 같은 문제가 반복되므로,
              구현이 확인되면 그때 다시 넣는다. */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-left bg-white/60 backdrop-blur-sm rounded-xl p-3">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-slate-700">설문 참여로 VN 토큰 적립</span>
            </div>
            <div className="flex items-center gap-3 text-left bg-white/60 backdrop-blur-sm rounded-xl p-3">
              <Shield className="w-5 h-5 text-trust" />
              {/* B-21: "완벽한 데이터 주권 보장" → 검증 1층이 모형이라 "보장" 근거 없음 */}
              <span className="text-sm text-slate-700">동의한 범위만 제공</span>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-trust to-trustTeal hover:opacity-90 text-white py-6 rounded-xl text-lg font-semibold shadow-lg shadow-trust/30 group-hover:shadow-xl transition-all"
          >
            개인으로 시작하기
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Enterprise Side - Dark & Professional */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex-1 min-h-[50vh] md:min-h-0 bg-gradient-to-br from-slate-900 via-navy-dark to-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden cursor-pointer group"
        onClick={handleSelectEnterprise}
      >
        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-trust/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />

        <motion.div
          className="relative z-10 text-center max-w-sm"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-black/30 border border-slate-600/50 group-hover:border-trust/50 transition-all">
            <Building2 className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">기업</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            데이터를 구매하고<br/>
            <span className="text-trust font-semibold">비즈니스 통찰</span>을 얻으세요
          </p>

          <Button
            className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white py-6 rounded-xl text-lg font-semibold border border-slate-600/50 group-hover:border-trust/50 transition-all"
          >
            기업으로 시작하기
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DualModeEntryView;
