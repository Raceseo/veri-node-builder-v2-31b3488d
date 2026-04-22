import { useState } from "react";
import { 
  User, Building2, ArrowRight, Shield, Sparkles, 
  TrendingUp, Lock, FileCheck, ChevronRight,
  Smartphone, CreditCard, CheckCircle2, AlertTriangle,
  Fingerprint, BadgeCheck, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";

type UserType = "individual" | "enterprise" | null;
type OnboardingStep = "select" | "individual-verify" | "enterprise-verify" | "complete";

interface DualModeEntryViewProps {
  onComplete: (userType: UserType) => void;
}

const DualModeEntryView = ({ onComplete }: DualModeEntryViewProps) => {
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("select");
  
  // Individual state
  const [isMyDataConnecting, setIsMyDataConnecting] = useState(false);
  const [myDataConnected, setMyDataConnected] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  
  // Enterprise state
  const [businessNumber, setBusinessNumber] = useState("");
  const [ndaAgreed, setNdaAgreed] = useState(false);
  const [businessVerified, setBusinessVerified] = useState(false);

  const handleSelectIndividual = () => {
    setSelectedType("individual");
    setCurrentStep("individual-verify");
  };

  const handleSelectEnterprise = () => {
    setSelectedType("enterprise");
    setCurrentStep("enterprise-verify");
  };

  const handleMyDataConnect = () => {
    setIsMyDataConnecting(true);
    // Simulate connection
    setTimeout(() => {
      setIsMyDataConnecting(false);
      setMyDataConnected(true);
      setTimeout(() => {
        setVerificationComplete(true);
      }, 1500);
    }, 2000);
  };

  const handleBusinessVerify = () => {
    if (businessNumber.length >= 10 && ndaAgreed) {
      setBusinessVerified(true);
    }
  };

  const handleComplete = () => {
    onComplete(selectedType);
  };

  // Entry Selection Screen
  if (currentStep === "select") {
    return (
      <div className="min-h-screen flex">
        {/* Individual Side - Bright & Friendly */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8 relative overflow-hidden cursor-pointer group"
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

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-left bg-white/60 backdrop-blur-sm rounded-xl p-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-slate-700">데이터 신뢰 점수 2배 상승</span>
              </div>
              <div className="flex items-center gap-3 text-left bg-white/60 backdrop-blur-sm rounded-xl p-3">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-slate-700">설문 참여로 VN 토큰 적립</span>
              </div>
              <div className="flex items-center gap-3 text-left bg-white/60 backdrop-blur-sm rounded-xl p-3">
                <Shield className="w-5 h-5 text-trust" />
                <span className="text-sm text-slate-700">완벽한 데이터 주권 보장</span>
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
          className="flex-1 bg-gradient-to-br from-slate-900 via-navy-dark to-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden cursor-pointer group"
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
              V-Core 기술로 안전하게 데이터를 구매하고<br/>
              <span className="text-trust font-semibold">비즈니스 통찰</span>을 얻으세요
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-left bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <Lock className="w-5 h-5 text-trust" />
                <span className="text-sm text-slate-300">GDPR/CCPA 완벽 준수</span>
              </div>
              <div className="flex items-center gap-3 text-left bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-slate-300">V-Core 품질 보증 데이터</span>
              </div>
              <div className="flex items-center gap-3 text-left bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-300">전용 프리미엄 마켓플레이스</span>
              </div>
            </div>

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
  }

  // Individual Onboarding - MyData + CI/DI Verification
  if (currentStep === "individual-verify") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-trust to-trustTeal flex items-center justify-center mx-auto mb-4 shadow-lg shadow-trust/30">
              <Fingerprint className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">본인 인증</h1>
            <p className="text-slate-600">마이데이터로 1초 만에 연결하세요</p>
          </div>

          {/* 데이터 주권 철학 배지 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm mb-1">
                  🔐 본인인증은 데이터 주권의 시작입니다
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  당신만이 당신의 데이터를 관리할 수 있도록, 진짜 주인이 누구인지 확인하는 과정입니다. VeriNode는 이 인증 외의 어떤 용도로도 개인정보를 사용하지 않습니다.
                </p>
              </div>
            </div>
          </motion.div>

          {/* MyData Connection Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-trust to-trustTeal flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">마이데이터 연결</h3>
                  <p className="text-sm text-slate-500">금융/공공 데이터 통합</p>
                </div>
              </div>
              {myDataConnected && (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              )}
            </div>

            {!myDataConnected ? (
              <Button
                onClick={handleMyDataConnect}
                disabled={isMyDataConnecting}
                className="w-full bg-gradient-to-r from-trust to-trustTeal hover:opacity-90 text-white py-6 rounded-xl text-lg font-semibold"
              >
                {isMyDataConnecting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    연결 중...
                  </span>
                ) : (
                  <>
                    1초 만에 데이터 불러오기
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            ) : (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">마이데이터 연결 완료</span>
                </div>
              </div>
            )}

            {/* Trust Score Bonus Notice */}
            <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">신뢰 점수 2배 상승!</p>
                  <p className="text-xs text-amber-600 mt-1">마이데이터로 제출 시 더 높은 보상을 받을 수 있습니다</p>
                </div>
              </div>
            </div>
          </div>

          {/* CI/DI Verification */}
          <AnimatePresence>
            {myDataConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl p-6 mb-6"
              >
                <h3 className="font-semibold text-slate-800 mb-4">본인 인증 (CI/DI)</h3>
                
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-trust hover:bg-trust/5 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-800">카카오페이 인증</p>
                      <p className="text-xs text-slate-500">간편하게 본인 인증</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                  </button>

                  <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-trust hover:bg-trust/5 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <BadgeCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-800">PASS 인증</p>
                      <p className="text-xs text-slate-500">휴대폰 본인 인증</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                  </button>

                  <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-trust hover:bg-trust/5 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Fingerprint className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-800">생체 인증</p>
                      <p className="text-xs text-slate-500">지문/Face ID로 인증</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* V-Core Verification Animation */}
          <AnimatePresence>
            {verificationComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500 rounded-2xl shadow-xl p-6 mb-6 text-white"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                  >
                    <CheckCircle2 className="w-12 h-12" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg">V-Core 검증 완료</h3>
                    <p className="text-emerald-100 text-sm">원본 데이터 무결성 검증 완료</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {verificationComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-trust to-trustTeal hover:opacity-90 text-white py-6 rounded-xl text-lg font-semibold"
              >
                대시보드로 이동
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* Partner Logos */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 mb-4">마이데이터 공식 파트너</p>
            <div className="flex justify-center gap-4 opacity-60">
              <div className="w-16 h-8 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-500">금융위</div>
              <div className="w-16 h-8 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-500">NIA</div>
              <div className="w-16 h-8 bg-slate-200 rounded flex items-center justify-center text-xs text-slate-500">KISA</div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Enterprise Onboarding - Business Number + NDA
  if (currentStep === "enterprise-verify") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-dark to-slate-950 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mx-auto mb-4 shadow-lg border border-slate-600/50">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">기업 인증</h1>
            <p className="text-slate-400">사업자 정보를 입력하세요</p>
          </div>

          {/* Business Number Input */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
            <label className="block text-sm text-slate-300 mb-2">사업자등록번호</label>
            <Input
              type="text"
              placeholder="000-00-00000"
              value={businessNumber}
              onChange={(e) => setBusinessNumber(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-trust text-lg py-6"
            />
            <p className="text-xs text-slate-500 mt-2">하이픈(-) 포함하여 입력하세요</p>
          </div>

          {/* NDA Agreement */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-trust" />
              영업비밀 보호 서약 (NDA)
            </h3>
            
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto text-sm text-slate-400 leading-relaxed">
              <p className="mb-2">본 서약서는 VeriNode 플랫폼을 통해 제공받는 모든 데이터 및 관련 정보의 기밀 유지를 위한 것입니다.</p>
              <p className="mb-2">1. 데이터의 무단 복제, 배포, 제3자 공유 금지</p>
              <p className="mb-2">2. 허가된 목적 외 사용 금지</p>
              <p className="mb-2">3. 개인정보보호법 및 GDPR 준수</p>
              <p>4. 위반 시 법적 책임 및 손해배상 의무</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox 
                checked={ndaAgreed}
                onCheckedChange={(checked) => setNdaAgreed(checked as boolean)}
                className="mt-1 border-slate-500 data-[state=checked]:bg-trust data-[state=checked]:border-trust"
              />
              <span className="text-sm text-slate-300">
                상기 영업비밀 보호 서약에 동의합니다. 위반 시 민·형사상 책임을 질 것을 서약합니다.
              </span>
            </label>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm text-amber-200 font-medium">데이터 오용 시 법적 조치</p>
                <p className="text-xs text-amber-300/70 mt-1">
                  NDA 위반 시 최대 10억원의 손해배상 및 형사고발 조치가 진행될 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleBusinessVerify}
            disabled={businessNumber.length < 10 || !ndaAgreed}
            className={`w-full py-6 rounded-xl text-lg font-semibold transition-all ${
              businessNumber.length >= 10 && ndaAgreed
                ? "bg-gradient-to-r from-trust to-trustTeal hover:opacity-90 text-white"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            기업 인증 진행
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>

          {/* V-Core Verification Animation */}
          <AnimatePresence>
            {businessVerified && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="bg-emerald-500 rounded-2xl shadow-xl p-6 mb-6 text-white">
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                    >
                      <CheckCircle2 className="w-12 h-12" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-lg">기업 인증 완료</h3>
                      <p className="text-emerald-100 text-sm">프리미엄 데이터 마켓에 접근 가능</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleComplete}
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white py-6 rounded-xl text-lg font-semibold border border-slate-600/50"
                >
                  기업 대시보드로 이동
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust Indicators */}
          <div className="mt-8 flex justify-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">ISO 27001</div>
              <p className="text-xs text-slate-500">정보보안 인증</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">GDPR</div>
              <p className="text-xs text-slate-500">EU 규정 준수</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">ISMS-P</div>
              <p className="text-xs text-slate-500">국내 인증</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default DualModeEntryView;
