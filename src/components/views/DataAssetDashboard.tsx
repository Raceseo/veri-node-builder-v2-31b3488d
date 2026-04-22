import { useState, useEffect } from "react";
import { 
  Wallet, TrendingUp, Clock, Building2, Heart, Briefcase, 
  ShoppingBag, Car, GraduationCap, AlertTriangle, Sparkles, ArrowLeft,
  Award, Calendar, ChevronRight, Shield, Zap, Users,
  FileText, RefreshCw, Gift, Crown, Star
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DataCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  monthlyValue: number;
  connected: boolean;
  lastSync: string;
  healthScore: number; // 0-100
}

interface UsageHistory {
  id: string;
  title: string;
  type: "research" | "marketing" | "policy";
  company: string;
  date: string;
  reward: number;
  dataUsed: string[];
}

// Audio context for sound effects
const playToggleSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {}
};

interface DataAssetDashboardProps {
  onBack?: () => void;
}

const DataAssetDashboard = ({ onBack }: DataAssetDashboardProps) => {
  const [categories, setCategories] = useState<DataCategory[]>([
    { id: "finance", name: "금융 데이터", icon: Building2, color: "text-emerald-400", bgColor: "from-emerald-500/20 to-teal-500/20", monthlyValue: 12000, connected: true, lastSync: "방금 전", healthScore: 95 },
    { id: "health", name: "건강 데이터", icon: Heart, color: "text-rose-400", bgColor: "from-rose-500/20 to-pink-500/20", monthlyValue: 18000, connected: true, lastSync: "1시간 전", healthScore: 88 },
    { id: "career", name: "직무 데이터", icon: Briefcase, color: "text-blue-400", bgColor: "from-blue-500/20 to-indigo-500/20", monthlyValue: 15000, connected: true, lastSync: "3시간 전", healthScore: 72 },
    { id: "shopping", name: "소비 데이터", icon: ShoppingBag, color: "text-amber-400", bgColor: "from-amber-500/20 to-orange-500/20", monthlyValue: 8000, connected: false, lastSync: "연결 안됨", healthScore: 0 },
    { id: "mobility", name: "이동 데이터", icon: Car, color: "text-violet-400", bgColor: "from-violet-500/20 to-purple-500/20", monthlyValue: 6000, connected: false, lastSync: "연결 안됨", healthScore: 0 },
    { id: "education", name: "학습 데이터", icon: GraduationCap, color: "text-cyan-400", bgColor: "from-cyan-500/20 to-sky-500/20", monthlyValue: 5000, connected: true, lastSync: "어제", healthScore: 65 },
  ]);

  const [pendingToggle, setPendingToggle] = useState<DataCategory | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [glowingCard, setGlowingCard] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedUsage, setSelectedUsage] = useState<UsageHistory | null>(null);
  const [currentPensionReward, setCurrentPensionReward] = useState(38500);

  const usageHistory: UsageHistory[] = [
    { id: "1", title: "2030 금융 소비 트렌드 연구", type: "research", company: "한국금융연구원", date: "오늘 14:23", reward: 500, dataUsed: ["금융 데이터", "소비 데이터"] },
    { id: "2", title: "건강식품 타겟 마케팅", type: "marketing", company: "CJ제일제당", date: "어제 09:15", reward: 300, dataUsed: ["건강 데이터"] },
    { id: "3", title: "청년 주거 정책 수립 기초조사", type: "policy", company: "국토교통부", date: "12월 17일", reward: 800, dataUsed: ["금융 데이터", "직무 데이터"] },
    { id: "4", title: "직장인 스트레스 지수 연구", type: "research", company: "서울대학교 의과대학", date: "12월 15일", reward: 450, dataUsed: ["건강 데이터", "직무 데이터"] },
  ];

  // Simulate real-time pension accumulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPensionReward(prev => {
        const increment = Math.random() * 30 + 5;
        return Math.round(prev + increment);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const connectedCategories = categories.filter(c => c.connected);
  const totalMonthlyValue = connectedCategories.reduce((sum, c) => sum + c.monthlyValue, 0);
  const totalAssetValue = totalMonthlyValue * 12 * 3; // Estimated 3-year value
  const dataYield = ((totalMonthlyValue / totalAssetValue) * 100 * 12).toFixed(1);
  
  const tier = totalMonthlyValue >= 50000 ? "Diamond" : totalMonthlyValue >= 40000 ? "Platinum" : totalMonthlyValue >= 30000 ? "Gold" : "Silver";
  const tierColor = tier === "Diamond" ? "from-cyan-300 via-blue-400 to-purple-500" : tier === "Platinum" ? "from-slate-300 to-slate-100" : tier === "Gold" ? "from-amber-400 to-yellow-300" : "from-slate-400 to-slate-300";
  const tierBonusRate = tier === "Diamond" ? 2.5 : tier === "Platinum" ? 2.0 : tier === "Gold" ? 1.5 : 1.0;

  // Dividend calculation
  const estimatedDividend = Math.round(totalMonthlyValue * 0.15); // 15% of monthly value
  const dividendPayoutDate = new Date("2024-12-31");
  const today = new Date();
  const daysUntilDividend = Math.max(0, Math.ceil((dividendPayoutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Next pension date
  const nextPensionDate = "12월 25일";
  const pensionCountdown = 5; // days

  const handleToggleCategory = (category: DataCategory) => {
    if (category.connected) {
      setPendingToggle(category);
      setShowWarning(true);
    } else {
      playToggleSound();
      setGlowingCard(category.id);
      setCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, connected: true, lastSync: "방금 전", healthScore: 100 } : c
      ));
      setTimeout(() => setGlowingCard(null), 1000);
    }
  };

  const confirmDisconnect = () => {
    if (pendingToggle) {
      setCategories(prev => prev.map(c => 
        c.id === pendingToggle.id ? { ...c, connected: false, lastSync: "연결 안됨", healthScore: 0 } : c
      ));
    }
    setShowWarning(false);
    setPendingToggle(null);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "research": return { label: "연구", color: "bg-indigo-500/20 text-indigo-300", icon: FileText };
      case "marketing": return { label: "마케팅", color: "bg-purple-500/20 text-purple-300", icon: Users };
      case "policy": return { label: "정책", color: "bg-emerald-500/20 text-emerald-300", icon: Shield };
      default: return { label: "기타", color: "bg-slate-500/20 text-slate-300", icon: FileText };
    }
  };

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: "최상", color: "text-emerald-400", bgColor: "bg-emerald-500" };
    if (score >= 70) return { label: "양호", color: "text-amber-400", bgColor: "bg-amber-500" };
    if (score >= 50) return { label: "업데이트 권장", color: "text-orange-400", bgColor: "bg-orange-500" };
    return { label: "연결 필요", color: "text-slate-500", bgColor: "bg-slate-600" };
  };

  const openReceiptModal = (usage: UsageHistory) => {
    setSelectedUsage(usage);
    setShowReceiptModal(true);
  };

  return (
    <div className="bg-[#0f172a] min-h-full pb-24">
      {/* Header */}
      {onBack && (
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 bg-[#0f172a]/90 backdrop-blur-xl border-b border-indigo-500/20">
          <button onClick={onBack} className="p-2 -ml-2 text-white hover:text-indigo-400 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">데이터 자산 대시보드</h1>
        </header>
      )}
      
      <div className="px-4 py-6 space-y-6">
      {/* ===== 1. 데이터 자산 및 수익률 헤더 ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] p-6 border border-indigo-500/30 shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />
        
        <div className="relative">
          {/* Tier Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-300 text-sm font-medium">현재 나의 데이터 자산 가치</span>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-white/10",
              "bg-gradient-to-r", tierColor
            )}>
              <Crown className="w-4 h-4 text-slate-900" />
              <span className="text-slate-900 font-bold text-sm">{tier}</span>
            </div>
          </div>
          
          {/* Asset Value */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-bold text-white tracking-tight">
              ₩{totalAssetValue.toLocaleString()}
            </span>
          </div>
          
          {/* Data Yield & Change */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-bold">데이터 연금 수익률 {dataYield}%</span>
            </div>
            <span className="text-emerald-400 text-sm flex items-center gap-1">
              +1.2% ▲ <span className="text-slate-500">지난달 대비</span>
            </span>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 pt-5 border-t border-indigo-500/20">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{connectedCategories.length}</p>
              <p className="text-xs text-slate-500">연동 데이터</p>
            </div>
            <div className="text-center border-x border-indigo-500/20">
              <p className="text-2xl font-bold text-amber-400">x{tierBonusRate}</p>
              <p className="text-xs text-slate-500">등급 보너스</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">₩{totalMonthlyValue.toLocaleString()}</p>
              <p className="text-xs text-slate-500">월 예상 수익</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 2. 데이터 연금 센터 ===== */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/50 to-slate-900/80 border border-emerald-500/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">데이터 연금 센터</h2>
            <p className="text-xs text-emerald-400/70">Data Pension Center</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-emerald-400 text-xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            실시간
          </div>
        </div>

        {/* Current Month Progress */}
        <div className="bg-slate-900/60 rounded-xl p-4 mb-4 border border-emerald-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">이번 달 누적 연금</span>
            <span className="text-xs text-amber-400 animate-pulse">● 누적 중</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-emerald-400">₩{currentPensionReward.toLocaleString()}</span>
            <span className="text-slate-500 text-sm">/ ₩{totalMonthlyValue.toLocaleString()} 예상</span>
          </div>
          <Progress value={(currentPensionReward / totalMonthlyValue) * 100} className="h-2 bg-slate-800" />
        </div>

        {/* Rental Status List */}
        <div className="space-y-2 mb-4">
          {connectedCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.id} className="flex items-center gap-3 bg-slate-900/40 rounded-xl px-4 py-3 border border-emerald-500/10">
                <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center", category.bgColor)}>
                  <Icon className={cn("w-4 h-4", category.color)} />
                </div>
                <div className="flex-1">
                  <span className="text-white text-sm font-medium">{category.name}</span>
                  <span className="ml-2 text-xs text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded-full">임대 중</span>
                </div>
                <span className="text-amber-400 font-bold">+₩{category.monthlyValue.toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-emerald-900/30 via-amber-900/20 to-emerald-900/30 rounded-xl border border-emerald-500/20">
          <Calendar className="w-5 h-5 text-amber-400" />
          <span className="text-white">다음 데이터 정산일:</span>
          <span className="text-xl font-bold text-amber-400">{nextPensionDate}</span>
          <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-full">D-{pensionCountdown}</span>
        </div>
      </div>

      {/* ===== 3. 데이터 배당 센터 ===== */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900/80 border border-amber-500/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">데이터 배당 센터</h2>
            <p className="text-xs text-amber-400/70">Data Dividend Center</p>
          </div>
        </div>

        {/* Dividend Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-900/30 via-yellow-900/20 to-amber-900/30 rounded-xl p-5 border border-amber-500/30 mb-4">
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
              <Star className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-300 font-medium">Loyal Shareholder</span>
            </div>
          </div>
          
          <p className="text-amber-300/80 text-sm mb-2">예상 배당금</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-amber-400">₩{estimatedDividend.toLocaleString()}</span>
          </div>

          {/* Dividend Progress Gauge */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>배당 충전 진행률</span>
              <span>78%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[78%] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
            </div>
          </div>

          {/* Payout Date */}
          <div className="flex items-center justify-between py-3 px-4 bg-slate-900/50 rounded-xl">
            <span className="text-slate-300 text-sm">배당 지급 예정일</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">2024년 12월 31일</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">D-{daysUntilDividend}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-amber-400/60 text-xs">
          🎁 플랫폼 수익의 일부가 데이터 제공자에게 배당금으로 환원됩니다
        </p>
      </div>

      {/* ===== 4. 데이터 통제 & 무결성 관리 ===== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
          <h2 className="text-lg font-bold text-white">데이터 통제 센터</h2>
          <span className="text-xs text-slate-500 ml-auto">Control & Health</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isGlowing = glowingCard === category.id;
            const healthStatus = getHealthStatus(category.healthScore);
            
            return (
              <div 
                key={category.id}
                className={cn(
                  "relative bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border transition-all duration-300",
                  category.connected 
                    ? "border-indigo-500/30 shadow-lg" 
                    : "border-slate-800/50 opacity-60",
                  isGlowing && "animate-pulse"
                )}
              >
                {isGlowing && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/30 to-teal-500/30 animate-pulse" />
                    <div className="absolute -inset-1 rounded-3xl bg-emerald-500/20 blur-xl animate-pulse" />
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Sparkles
                        key={i}
                        className="absolute w-4 h-4 text-emerald-300 animate-ping"
                        style={{
                          left: `${15 + Math.random() * 70}%`,
                          top: `${15 + Math.random() * 70}%`,
                          animationDelay: `${i * 100}ms`,
                        }}
                      />
                    ))}
                  </>
                )}
                
                <div className="relative flex items-start justify-between mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    category.bgColor
                  )}>
                    <Icon className={cn("w-5 h-5", category.color)} />
                  </div>
                  <Switch 
                    checked={category.connected}
                    onCheckedChange={() => handleToggleCategory(category)}
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
                
                <h3 className="relative text-white font-medium text-sm mb-1">{category.name}</h3>
                
                <div className="relative flex items-baseline gap-1 mb-2">
                  <span className={cn(
                    "text-lg font-bold",
                    category.connected ? "text-emerald-400" : "text-slate-600"
                  )}>
                    +₩{category.monthlyValue.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">/월</span>
                </div>
                
                {/* Health Status */}
                {category.connected && (
                  <div className="relative flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">데이터 건강</span>
                        <span className={healthStatus.color}>{healthStatus.label}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", healthStatus.bgColor)}
                          style={{ width: `${category.healthScore}%` }}
                        />
                      </div>
                    </div>
                    {category.healthScore < 80 && (
                      <button className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                
                <div className="relative flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-500">{category.lastSync}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== 5. 투명한 수익 영수증 (Usage Timeline) ===== */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
          <h2 className="text-lg font-bold text-white">실시간 데이터 활용 내역</h2>
          <span className="text-xs text-slate-500 ml-auto">Usage Timeline</span>
        </div>
        
        <div className="space-y-3">
          {usageHistory.map((item, index) => {
            const typeInfo = getTypeLabel(item.type);
            const TypeIcon = typeInfo.icon;
            
            return (
              <button 
                key={item.id}
                onClick={() => openReceiptModal(item)}
                className="w-full bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-800/50 relative text-left hover:border-indigo-500/30 transition-colors"
              >
                {/* Timeline connector */}
                {index < usageHistory.length - 1 && (
                  <div className="absolute left-7 top-14 w-0.5 h-6 bg-slate-800" />
                )}
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-indigo-500/50 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{item.title}</h4>
                        <p className="text-slate-500 text-xs mt-0.5">{item.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-semibold text-sm shrink-0">
                          +{item.reward} VN
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1", typeInfo.color)}>
                        <TypeIcon className="w-3 h-3" />
                        {typeInfo.label}
                      </span>
                      <span className="text-xs text-slate-600">{item.date}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        <button className="w-full mt-4 py-3 text-center text-indigo-400 text-sm hover:text-indigo-300 transition-colors">
          전체 내역 보기 →
        </button>
      </div>

      {/* Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="bg-[#0f172a] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              데이터 제공 중단
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {pendingToggle && (
                <>
                  <span className="font-medium text-white">{pendingToggle.name}</span> 제공을 중단하면
                  <br />
                  예상 수익이{" "}
                  <span className="text-rose-400 font-bold">
                    월 ₩{pendingToggle.monthlyValue.toLocaleString()}
                  </span>{" "}
                  감소합니다.
                  <br /><br />
                  정말 중단하시겠습니까?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              취소
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDisconnect}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              중단하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="bg-[#0f172a] border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              정직한 수익 배분 영수증
            </DialogTitle>
          </DialogHeader>
          
          {selectedUsage && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h4 className="text-white font-medium mb-2">{selectedUsage.title}</h4>
                <p className="text-slate-400 text-sm">{selectedUsage.company}</p>
                <p className="text-slate-500 text-xs mt-1">{selectedUsage.date}</p>
              </div>

              <div className="space-y-2">
                <p className="text-slate-400 text-sm">사용된 데이터</p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsage.dataUsed.map((data, i) => (
                    <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 text-xs rounded-full border border-indigo-500/20">
                      {data}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">데이터 판매 수익</span>
                  <span className="text-emerald-400 font-bold text-lg">+{selectedUsage.reward} VN</span>
                </div>
                <p className="text-emerald-400/60 text-xs">
                  ✓ 귀하의 데이터가 합법적으로 판매되어 발생한 정당한 수익입니다
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                <Shield className="w-4 h-4 text-indigo-400" />
                <p className="text-slate-500 text-xs">VeriNode 블록체인에 기록된 투명한 거래입니다</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default DataAssetDashboard;
