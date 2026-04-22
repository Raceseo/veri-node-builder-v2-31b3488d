import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Zap,
  Shield,
  Upload,
  Camera,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Building2,
  Smartphone,
  Link2,
  Sparkles,
  TrendingUp,
  Lock,
  BadgeCheck,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MyDataUploadViewProps {
  onBack: () => void;
}

// Official partner logos data
const officialPartners = [
  { id: 'mydata', name: '금융결제원', type: '정부' },
  { id: 'fss', name: '금융감독원', type: '정부' },
  { id: 'bok', name: '한국은행', type: '정부' },
  { id: 'kb', name: 'KB국민은행', type: '금융' },
  { id: 'shinhan', name: '신한은행', type: '금융' },
  { id: 'hana', name: '하나은행', type: '금융' },
  { id: 'woori', name: '우리은행', type: '금융' },
  { id: 'kakao', name: '카카오뱅크', type: '핀테크' },
  { id: 'toss', name: '토스뱅크', type: '핀테크' },
];

export const MyDataUploadView = ({ onBack }: MyDataUploadViewProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showPhotoWarning, setShowPhotoWarning] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Simulate MyData connection
  const handleMyDataConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setShowVerification(true);
    }, 2000);
  };

  // Handle other upload methods
  const handleUploadMethod = (method: string) => {
    if (method === 'photo') {
      setShowPhotoWarning(true);
    } else {
      setSelectedMethod(method);
    }
  };

  const confirmPhotoUpload = () => {
    setShowPhotoWarning(false);
    setSelectedMethod('photo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-blue-500/20">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">데이터 업로드</h1>
              <p className="text-xs text-blue-400">마이데이터 연동으로 빠르게 시작하세요</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* MyData Priority Section */}
        <div className="relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-3xl blur-xl opacity-50 animate-pulse" />
          
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 border border-blue-400/30 shadow-2xl">
            {/* Sparkle decorations */}
            <div className="absolute top-4 right-4 animate-pulse">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div className="absolute bottom-4 left-4 animate-pulse delay-300">
              <Sparkles className="w-4 h-4 text-yellow-300/70" />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Zap className="w-8 h-8 text-yellow-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-bold text-yellow-300">추천</span>
                </div>
                <h2 className="text-xl font-bold text-white">1초 만에 데이터 불러오기</h2>
              </div>
            </div>

            <p className="text-sm text-blue-100 mb-5">
              정부 공인 마이데이터를 통해 은행, 카드, 보험 데이터를 한 번에 안전하게 연동하세요.
            </p>

            {/* Trust Score Reward Highlight */}
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">마이데이터 특별 보상</h4>
                  <p className="text-xs text-blue-100 leading-relaxed">
                    마이데이터로 제출 시 <span className="font-bold text-yellow-300">데이터 신뢰 점수가 2배 상승</span>하며,{' '}
                    <span className="font-bold text-yellow-300">더 높은 보상</span>을 받을 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* MyData Connect Button */}
            <Button
              onClick={handleMyDataConnect}
              disabled={isConnecting || isConnected}
              className={cn(
                "w-full h-14 text-base font-bold rounded-xl transition-all duration-300",
                isConnected 
                  ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                  : "bg-white hover:bg-white/90 text-blue-600 shadow-lg shadow-white/30"
              )}
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>마이데이터 연동 중...</span>
                </div>
              ) : isConnected ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>연동 완료</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  <span>마이데이터 연동하기</span>
                </div>
              )}
            </Button>

            {/* Connected apps indicator */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-100">
              <Lock className="w-3 h-3" />
              <span>256bit SSL 암호화 • 개인정보 보호법 준수</span>
            </div>
          </div>
        </div>

        {/* V-Core Verification Animation */}
        {showVerification && (
          <div className="animate-fade-in p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center animate-scale-in">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-emerald-400 animate-ping opacity-50" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">V-Core 검증 완료</span>
                </div>
                <h3 className="font-bold text-white text-lg">원본 데이터 무결성 검증 완료</h3>
                <p className="text-xs text-emerald-300/80 mt-1">
                  마이데이터 원본이 안전하게 확인되었습니다
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alternative Upload Methods */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-xs text-slate-500">또는 다른 방법으로 제출</span>
            <div className="flex-1 h-px bg-slate-700/50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Document Upload */}
            <button
              onClick={() => handleUploadMethod('document')}
              className={cn(
                "p-4 rounded-xl border transition-all",
                selectedMethod === 'document'
                  ? "bg-blue-500/20 border-blue-500/50"
                  : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-medium text-white text-sm">서류 업로드</p>
              <p className="text-[10px] text-slate-500 mt-1">PDF, 이미지 파일</p>
            </button>

            {/* Photo Upload */}
            <button
              onClick={() => handleUploadMethod('photo')}
              className={cn(
                "p-4 rounded-xl border transition-all",
                selectedMethod === 'photo'
                  ? "bg-blue-500/20 border-blue-500/50"
                  : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                <Camera className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-medium text-white text-sm">사진 촬영</p>
              <p className="text-[10px] text-slate-500 mt-1">실시간 인증 필요</p>
            </button>

            {/* Manual Entry */}
            <button
              onClick={() => handleUploadMethod('manual')}
              className={cn(
                "p-4 rounded-xl border transition-all col-span-2",
                selectedMethod === 'manual'
                  ? "bg-blue-500/20 border-blue-500/50"
                  : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-slate-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white text-sm">직접 입력</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">수동으로 데이터 입력 (신뢰 점수 낮음)</p>
                </div>
              </div>
            </button>
          </div>

          {/* Trust Score Comparison */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">제출 방법별 신뢰 점수</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">마이데이터 연동</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                  </div>
                  <span className="text-xs font-bold text-cyan-400">+20점</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">서류 업로드</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div className="w-[60%] h-full bg-gradient-to-r from-violet-500 to-purple-400" />
                  </div>
                  <span className="text-xs font-bold text-violet-400">+12점</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">사진 촬영</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div className="w-[50%] h-full bg-gradient-to-r from-amber-500 to-yellow-400" />
                  </div>
                  <span className="text-xs font-bold text-amber-400">+10점</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">직접 입력</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div className="w-[25%] h-full bg-gradient-to-r from-slate-500 to-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">+5점</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Official Partners Section */}
        <div className="pt-4">
          <div className="text-center mb-4">
            <h3 className="text-sm font-semibold text-slate-400 mb-1">공식 마이데이터 파트너</h3>
            <p className="text-[10px] text-slate-600">정부 및 금융권 인증 연동 기관</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {officialPartners.map(partner => (
              <div 
                key={partner.id}
                className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600/50 to-slate-700/50 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{partner.name}</p>
                    <p className="text-[9px] text-slate-500">{partner.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-600">
              VeriNode는 금융위원회 마이데이터 사업자로 등록되어 있습니다
            </p>
          </div>
        </div>
      </div>

      {/* Photo Upload Warning Dialog */}
      <Dialog open={showPhotoWarning} onOpenChange={setShowPhotoWarning}>
        <DialogContent className="max-w-sm bg-slate-900 border-red-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              위조 검사 경고
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              사진 제출 전 반드시 확인하세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white leading-relaxed">
                    제출하신 사진은 <span className="font-bold text-red-400">V-Core의 정밀 위조 검사</span>를 거치게 됩니다.
                  </p>
                  <p className="text-sm text-white mt-2 leading-relaxed">
                    위조로 판명될 경우, 계정이 <span className="font-bold text-red-400">영구 정지</span>될 수 있으며, 
                    법적 조치가 취해질 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-400">
                V-Core AI는 다음을 검사합니다:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  메타데이터 조작 여부
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  이미지 편집 흔적
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  AI 생성 이미지 탐지
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  동일 이미지 중복 사용
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPhotoWarning(false)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                취소
              </Button>
              <Button
                onClick={confirmPhotoUpload}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                동의 후 진행
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyDataUploadView;
