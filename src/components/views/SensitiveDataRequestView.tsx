import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  FileWarning,
  Server,
  Wifi,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  Database,
  Heart,
  CreditCard,
  Briefcase,
  FileText,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SensitiveDataRequestViewProps {
  onBack: () => void;
}

interface DataItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  sensitivityLevel: "high" | "critical";
}

interface PendingRequest {
  id: string;
  dataType: string;
  purpose: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  maskedPreview: string;
}

const sensitiveDataItems: DataItem[] = [
  {
    id: "health_detailed",
    name: "건강 정밀 데이터",
    description: "상세 진단 기록, 투약 내역, 유전 정보",
    icon: Heart,
    sensitivityLevel: "critical"
  },
  {
    id: "debt_detailed",
    name: "상세 부채 내역",
    description: "대출 잔액, 신용카드 사용 내역, 연체 정보",
    icon: CreditCard,
    sensitivityLevel: "critical"
  },
  {
    id: "income_breakdown",
    name: "소득 상세 내역",
    description: "월별 급여, 부업 소득, 투자 수익",
    icon: Briefcase,
    sensitivityLevel: "high"
  },
  {
    id: "financial_assets",
    name: "금융 자산 현황",
    description: "예금, 주식, 부동산 보유 현황",
    icon: Database,
    sensitivityLevel: "critical"
  },
  {
    id: "personal_contacts",
    name: "연락처 및 관계망",
    description: "가족 정보, 비상연락처, 사회적 관계",
    icon: FileText,
    sensitivityLevel: "high"
  },
];

const mockPendingRequests: PendingRequest[] = [
  {
    id: "req_001",
    dataType: "건강 정밀 데이터",
    purpose: "의료 연구 목적의 익명화된 건강 패턴 분석",
    status: "pending",
    requestedAt: "2025-01-15 14:30",
    maskedPreview: "●●●-●●●-●●●●"
  },
  {
    id: "req_002",
    dataType: "상세 부채 내역",
    purpose: "금융 상품 추천을 위한 신용 분석",
    status: "approved",
    requestedAt: "2025-01-14 09:15",
    maskedPreview: "대출잔액: ₩●●,●●●,●●●"
  },
];

export const SensitiveDataRequestView = ({ onBack }: SensitiveDataRequestViewProps) => {
  const [selectedDataType, setSelectedDataType] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestPhase, setRequestPhase] = useState<"idle" | "connecting" | "authenticating" | "requesting" | "complete">("idle");
  const [firewallNodes, setFirewallNodes] = useState<number[]>([]);

  // Security animation phases
  useEffect(() => {
    if (isRequesting) {
      const phases = ["connecting", "authenticating", "requesting", "complete"];
      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < phases.length) {
          setRequestPhase(phases[currentIndex] as any);
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setIsRequesting(false);
            setRequestPhase("idle");
          }, 1500);
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isRequesting]);

  // Firewall animation nodes
  useEffect(() => {
    if (isRequesting) {
      const interval = setInterval(() => {
        setFirewallNodes(prev => {
          const newNodes = [...prev, Date.now()];
          return newNodes.slice(-12);
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setFirewallNodes([]);
    }
  }, [isRequesting]);

  const handleRequest = () => {
    if (!selectedDataType || !purpose) return;
    setIsRequesting(true);
    setRequestPhase("connecting");
  };

  const getPhaseMessage = () => {
    switch (requestPhase) {
      case "connecting":
        return "보안 채널에 연결 중...";
      case "authenticating":
        return "방화벽 인증 진행 중...";
      case "requesting":
        return "사용자의 시크릿 금고에 접근 권한을 요청 중입니다...";
      case "complete":
        return "요청이 전송되었습니다. 사용자 승인 대기 중...";
      default:
        return "";
    }
  };

  const getStatusBadge = (status: PendingRequest["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 gap-1">
            <Clock className="w-3 h-3" />
            승인 대기
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-lime-500/20 text-lime-400 border border-lime-500/30 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            승인됨
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 gap-1">
            <XCircle className="w-3 h-3" />
            거부됨
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500/30 to-transparent" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4 bg-slate-950/95 backdrop-blur-xl border-b border-lime-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl hover:bg-lime-500/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-lime-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-lime-400" />
              민감 데이터 요청
            </h1>
            <p className="text-xs text-lime-400/70">Sensitive Data Request Protocol</p>
          </div>
          <Badge className="bg-lime-500/10 text-lime-400 border border-lime-500/30 gap-1 font-mono text-xs">
            <Lock className="w-3 h-3" />
            SECURE
          </Badge>
        </div>
      </div>

      {/* Security Animation Overlay */}
      {isRequesting && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 flex flex-col items-center justify-center">
          {/* Firewall Animation */}
          <div className="relative w-64 h-64 mb-8">
            {/* Central Vault */}
            <div className="absolute inset-1/4 rounded-full bg-gradient-to-br from-lime-500/20 to-emerald-500/20 border-2 border-lime-500/50 flex items-center justify-center animate-pulse">
              <Shield className="w-12 h-12 text-lime-400" />
            </div>
            
            {/* Rotating Firewall Rings */}
            <div className="absolute inset-0 rounded-full border border-lime-500/30 animate-[spin_8s_linear_infinite]">
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <div
                  key={angle}
                  className="absolute w-3 h-3 bg-lime-500 rounded-full animate-pulse"
                  style={{
                    top: `${50 + 45 * Math.sin((angle * Math.PI) / 180)}%`,
                    left: `${50 + 45 * Math.cos((angle * Math.PI) / 180)}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </div>
            
            <div className="absolute inset-2 rounded-full border border-emerald-500/20 animate-[spin_12s_linear_infinite_reverse]">
              {[30, 90, 150, 210, 270, 330].map((angle) => (
                <div
                  key={angle}
                  className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-60"
                  style={{
                    top: `${50 + 40 * Math.sin((angle * Math.PI) / 180)}%`,
                    left: `${50 + 40 * Math.cos((angle * Math.PI) / 180)}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </div>

            {/* Data Stream Particles */}
            {firewallNodes.map((node, i) => (
              <div
                key={node}
                className="absolute w-1 h-1 bg-lime-400 rounded-full animate-ping"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full">
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="50%"
                  y1="50%"
                  x2={`${50 + 40 * Math.cos((i * 90 * Math.PI) / 180)}%`}
                  y2={`${50 + 40 * Math.sin((i * 90 * Math.PI) / 180)}%`}
                  stroke="rgba(34, 197, 94, 0.3)"
                  strokeWidth="1"
                  className="animate-pulse"
                />
              ))}
            </svg>
          </div>

          {/* Status Icons */}
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
              requestPhase === "connecting" || requestPhase === "authenticating" || requestPhase === "requesting" || requestPhase === "complete"
                ? "bg-lime-500/30 text-lime-400"
                : "bg-gray-800 text-gray-600"
            )}>
              <Wifi className="w-5 h-5" />
            </div>
            <div className="w-8 h-px bg-gradient-to-r from-lime-500/50 to-transparent" />
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
              requestPhase === "authenticating" || requestPhase === "requesting" || requestPhase === "complete"
                ? "bg-lime-500/30 text-lime-400"
                : "bg-gray-800 text-gray-600"
            )}>
              <Server className="w-5 h-5" />
            </div>
            <div className="w-8 h-px bg-gradient-to-r from-lime-500/50 to-transparent" />
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
              requestPhase === "requesting" || requestPhase === "complete"
                ? "bg-lime-500/30 text-lime-400"
                : "bg-gray-800 text-gray-600"
            )}>
              <Lock className="w-5 h-5" />
            </div>
            <div className="w-8 h-px bg-gradient-to-r from-lime-500/50 to-transparent" />
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
              requestPhase === "complete"
                ? "bg-lime-500/30 text-lime-400"
                : "bg-gray-800 text-gray-600"
            )}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center">
            <p className="text-lime-400 font-mono text-lg mb-2">{getPhaseMessage()}</p>
            <div className="flex items-center gap-2 justify-center text-gray-500 text-sm">
              <div className="w-2 h-2 bg-lime-500 rounded-full animate-pulse" />
              <span className="font-mono">ENCRYPTED CONNECTION ACTIVE</span>
            </div>
          </div>

          {/* Terminal-like output */}
          <div className="mt-8 p-4 bg-gray-900/80 rounded-lg border border-lime-500/20 w-80 font-mono text-xs">
            <div className="text-gray-500">[{new Date().toLocaleTimeString()}] Initializing secure protocol...</div>
            {requestPhase !== "idle" && (
              <div className="text-lime-400 mt-1">[{new Date().toLocaleTimeString()}] Connection established</div>
            )}
            {(requestPhase === "authenticating" || requestPhase === "requesting" || requestPhase === "complete") && (
              <div className="text-emerald-400 mt-1">[{new Date().toLocaleTimeString()}] Firewall authenticated</div>
            )}
            {(requestPhase === "requesting" || requestPhase === "complete") && (
              <div className="text-cyan-400 mt-1">[{new Date().toLocaleTimeString()}] Accessing vault...</div>
            )}
            {requestPhase === "complete" && (
              <div className="text-amber-400 mt-1">[{new Date().toLocaleTimeString()}] Request sent - awaiting user approval</div>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 px-4 py-6 space-y-6">
        {/* Security Warning Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-300">민감 데이터 접근 프로토콜</p>
              <p className="text-xs text-amber-400/70 mt-1">
                이 기능은 사용자의 명시적 동의가 있어야만 데이터에 접근할 수 있습니다.
                모든 요청은 암호화되어 전송됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-5">
            <FileWarning className="w-5 h-5 text-lime-400" />
            <h2 className="font-bold text-white">데이터 요청 양식</h2>
          </div>

          <div className="space-y-5">
            {/* Data Type Dropdown */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">요청할 데이터 항목</label>
              <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 text-white h-12">
                  <SelectValue placeholder="민감 데이터 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {sensitiveDataItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                        className="text-white hover:bg-lime-500/10 focus:bg-lime-500/10"
                      >
                        <div className="flex items-center gap-3 py-1">
                          <Icon className="w-4 h-4 text-lime-400" />
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className={cn(
                              "ml-2 text-xs px-1.5 py-0.5 rounded",
                              item.sensitivityLevel === "critical"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-amber-500/20 text-amber-400"
                            )}>
                              {item.sensitivityLevel === "critical" ? "극비" : "민감"}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedDataType && (
                <p className="text-xs text-gray-500 mt-2">
                  {sensitiveDataItems.find(i => i.id === selectedDataType)?.description}
                </p>
              )}
            </div>

            {/* Purpose Input */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">데이터 활용 목적</label>
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="데이터를 어떤 목적으로 활용할 것인지 구체적으로 작성해주세요..."
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
              />
              {/* Warning Message */}
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-300">
                    <span className="font-semibold">주의:</span> 사용자에게 이 목적이 그대로 전달됩니다. 
                    명확하고 정직하게 작성해주세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleRequest}
              disabled={!selectedDataType || !purpose || isRequesting}
              className="w-full h-14 bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 mr-2" />
              보안 요청 전송
            </Button>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-lime-400" />
              <h2 className="font-bold text-white">승인 대기 현황</h2>
            </div>
            <Badge className="bg-gray-800 text-gray-400 border-0">
              {mockPendingRequests.filter(r => r.status === "pending").length}건 대기 중
            </Badge>
          </div>

          <div className="space-y-3">
            {mockPendingRequests.map((request) => (
              <div
                key={request.id}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  request.status === "pending"
                    ? "bg-gray-800/50 border-amber-500/30"
                    : request.status === "approved"
                    ? "bg-gray-800/50 border-lime-500/30"
                    : "bg-gray-800/50 border-red-500/30"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-white">{request.dataType}</p>
                    <p className="text-xs text-gray-500 mt-1">{request.requestedAt}</p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <p className="text-sm text-gray-400 mb-3">{request.purpose}</p>

                {/* Masked Data Preview */}
                <div className="p-3 rounded-lg bg-gray-900/80 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {request.status === "approved" ? (
                        <Eye className="w-4 h-4 text-lime-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-xs text-gray-500">데이터 미리보기</span>
                    </div>
                    {request.status !== "approved" && (
                      <Lock className="w-3 h-3 text-gray-600" />
                    )}
                  </div>
                  <p className={cn(
                    "font-mono text-sm mt-2",
                    request.status === "approved"
                      ? "text-lime-400"
                      : "text-gray-600"
                  )}>
                    {request.status === "approved" 
                      ? "대출잔액: ₩45,230,000"
                      : request.maskedPreview
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Info */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-lime-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">End-to-End 암호화</p>
              <p className="text-xs text-gray-500">AES-256 보안 프로토콜 적용</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-2 rounded-lg bg-gray-900/50 text-center">
              <p className="text-lg font-bold text-lime-400">256</p>
              <p className="text-[10px] text-gray-500">bit 암호화</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-900/50 text-center">
              <p className="text-lg font-bold text-lime-400">2FA</p>
              <p className="text-[10px] text-gray-500">이중 인증</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-900/50 text-center">
              <p className="text-lg font-bold text-lime-400">24/7</p>
              <p className="text-[10px] text-gray-500">모니터링</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensitiveDataRequestView;
