import { useState, useEffect } from "react";
import { 
  Shield, 
  Lock, 
  Fingerprint, 
  Eye,
  Heart,
  CreditCard,
  FileText,
  Pill,
  Home,
  Car,
  Briefcase,
  GraduationCap,
  Sparkles,
  Clock,
  CheckCircle2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SensitiveInfoConsentModal from "@/components/dialogs/SensitiveInfoConsentModal";

interface PrivateVaultViewProps {
  onClose: () => void;
}

type AuthStage = 'initial' | 'scanning' | 'encrypting' | 'authenticated';

interface VaultItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  reward: '3x' | '2x' | 'premium';
  category: 'health' | 'finance' | 'personal';
  isLinked: boolean;
}

const vaultItems: VaultItem[] = [
  {
    id: 'health-insurance',
    name: '건강보험 진료 기록',
    description: '병원 방문 및 진료 내역',
    icon: Heart,
    reward: '3x',
    category: 'health',
    isLinked: false
  },
  {
    id: 'medication',
    name: '처방약 복용 기록',
    description: '처방전 및 복약 이력',
    icon: Pill,
    reward: '3x',
    category: 'health',
    isLinked: false
  },
  {
    id: 'credit-score',
    name: '신용등급 정보',
    description: '금융 신용도 및 평가 데이터',
    icon: CreditCard,
    reward: '3x',
    category: 'finance',
    isLinked: false
  },
  {
    id: 'debt',
    name: '부채 및 대출 정보',
    description: '대출 현황 및 상환 기록',
    icon: FileText,
    reward: 'premium',
    category: 'finance',
    isLinked: false
  },
  {
    id: 'property',
    name: '부동산 자산 정보',
    description: '소유 부동산 및 거래 내역',
    icon: Home,
    reward: 'premium',
    category: 'finance',
    isLinked: false
  },
  {
    id: 'vehicle',
    name: '차량 소유 정보',
    description: '차량 등록 및 보험 정보',
    icon: Car,
    reward: '2x',
    category: 'personal',
    isLinked: false
  },
  {
    id: 'income',
    name: '소득 및 세금 정보',
    description: '연간 소득 및 납세 기록',
    icon: Briefcase,
    reward: 'premium',
    category: 'finance',
    isLinked: false
  },
  {
    id: 'education-detail',
    name: '학력 상세 정보',
    description: '성적, 졸업 증명, 자격증',
    icon: GraduationCap,
    reward: '2x',
    category: 'personal',
    isLinked: false
  }
];

export const PrivateVaultView = ({ onClose }: PrivateVaultViewProps) => {
  const [authStage, setAuthStage] = useState<AuthStage>('initial');
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [items, setItems] = useState(vaultItems);
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  useEffect(() => {
    if (authStage === 'initial') {
      const timer = setTimeout(() => setAuthStage('scanning'), 500);
      return () => clearTimeout(timer);
    }
    
    if (authStage === 'scanning') {
      const timer = setTimeout(() => setAuthStage('encrypting'), 2000);
      return () => clearTimeout(timer);
    }
    
    if (authStage === 'encrypting') {
      const interval = setInterval(() => {
        setEncryptionProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setAuthStage('authenticated'), 300);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [authStage]);

  // Show consent modal when authenticated
  useEffect(() => {
    if (authStage === 'authenticated') {
      const timer = setTimeout(() => setConsentModalOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [authStage]);

  const handleConsentConfirm = (consents: { health: boolean; finance: boolean; property: boolean; income: boolean }) => {
    // Update items based on consents
    setItems(prev => prev.map(item => {
      if (item.category === 'health' && consents.health) {
        return { ...item, isLinked: true };
      }
      if (item.category === 'finance' && (consents.finance || consents.property || consents.income)) {
        if (item.id === 'credit-score' || item.id === 'debt') return { ...item, isLinked: consents.finance };
        if (item.id === 'property') return { ...item, isLinked: consents.property };
        if (item.id === 'income') return { ...item, isLinked: consents.income };
      }
      if (item.category === 'personal') {
        return item;
      }
      return item;
    }));
    setConsentModalOpen(false);
  };

  const handleItemClick = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Toggle item directly
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, isLinked: !i.isLinked } : i
    ));
  };

  const linkedCount = items.filter(i => i.isLinked).length;
  const estimatedBonus = items
    .filter(i => i.isLinked)
    .reduce((acc, item) => {
      if (item.reward === '3x') return acc + 15000;
      if (item.reward === '2x') return acc + 10000;
      return acc + 20000;
    }, 0);

  // Authentication Screen
  if (authStage !== 'authenticated') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>

        {authStage === 'scanning' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center animate-pulse">
                  <Fingerprint className="w-14 h-14 text-cyan-400" />
                </div>
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-ping" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 font-medium">생체 인증 진행 중</span>
            </div>
            <p className="text-white/60 text-sm text-center">
              Face ID 또는 지문을 인식하고 있습니다...
            </p>
            <div className="mt-8 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[30%] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {authStage === 'encrypting' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
                <Shield className="w-16 h-16 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-medium">종단간 암호화 적용 중</span>
            </div>
            <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-100"
                style={{ width: `${encryptionProgress}%` }}
              />
            </div>
            <p className="text-white/60 text-sm">{encryptionProgress}% 완료</p>
            <div className="mt-8 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl max-w-xs">
              <p className="text-emerald-300/80 text-xs text-center leading-relaxed">
                🔐 모든 데이터는 군사급 AES-256 암호화로 보호됩니다
              </p>
            </div>
          </div>
        )}

        {authStage === 'initial' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
            <p className="text-white/60 text-sm mt-4">보안 연결 중...</p>
          </div>
        )}
      </div>
    );
  }

  // Main Vault View
  return (
    <>
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-white">Private Vault</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 rounded-full">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">E2E 암호화</span>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="p-4 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-fuchsia-600/20 rounded-2xl border border-violet-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">프리미엄 데이터 보너스</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      +₩{estimatedBonus.toLocaleString()}
                    </span>
                    <span className="text-white/40 text-sm">/월</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm">{linkedCount}개 항목 연동됨</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-300 mb-1">🔒 데이터 소멸 약속</h3>
                <p className="text-amber-200/80 text-sm leading-relaxed">
                  해당 데이터는 분석 즉시 <span className="font-bold text-amber-300">통계값으로만 저장</span>되며, 
                  개인 식별 정보는 <span className="font-bold text-amber-300">60분 이내에 영구 삭제</span>됩니다.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="text-white/80 font-medium">건강 정보</span>
            </div>
            <div className="space-y-3">
              {items.filter(i => i.category === 'health').map(item => (
                <VaultItemCard 
                  key={item.id}
                  item={item}
                  onToggle={() => handleItemClick(item.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="text-white/80 font-medium">금융 정보</span>
            </div>
            <div className="space-y-3">
              {items.filter(i => i.category === 'finance').map(item => (
                <VaultItemCard 
                  key={item.id}
                  item={item}
                  onToggle={() => handleItemClick(item.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span className="text-white/80 font-medium">개인 정보</span>
            </div>
            <div className="space-y-3">
              {items.filter(i => i.category === 'personal').map(item => (
                <VaultItemCard 
                  key={item.id}
                  item={item}
                  onToggle={() => handleItemClick(item.id)}
                />
              ))}
            </div>
          </div>

          <div className="h-24" />
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
          <Button 
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-violet-500/25"
            onClick={onClose}
          >
            <Lock className="w-5 h-5 mr-2" />
            안전하게 데이터 연동하기
          </Button>
        </div>
      </div>

      <SensitiveInfoConsentModal
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onConfirm={handleConsentConfirm}
      />
    </>
  );
};

interface VaultItemCardProps {
  item: VaultItem;
  onToggle: () => void;
}

const VaultItemCard = ({ item, onToggle }: VaultItemCardProps) => {
  const Icon = item.icon;
  
  const getRewardBadge = () => {
    if (item.reward === '3x') {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-bold px-2 py-0.5 text-xs animate-pulse">
          <Sparkles className="w-3 h-3 mr-1" />
          3X 보상
        </Badge>
      );
    }
    if (item.reward === '2x') {
      return (
        <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 font-bold px-2 py-0.5 text-xs">
          2X 보상
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 font-bold px-2 py-0.5 text-xs">
        <Sparkles className="w-3 h-3 mr-1" />
        Premium Only
      </Badge>
    );
  };

  return (
    <div 
      onClick={onToggle}
      className={cn(
        "relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
        item.isLinked
          ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          item.isLinked ? "bg-emerald-500/20" : "bg-white/10"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            item.isLinked ? "text-emerald-400" : "text-white/60"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate">{item.name}</h3>
            {getRewardBadge()}
          </div>
          <p className="text-sm text-white/50 truncate">{item.description}</p>
        </div>

        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
          item.isLinked
            ? "bg-emerald-500"
            : "bg-white/10 border border-white/20"
        )}>
          {item.isLinked && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
      </div>

      {item.isLinked && (
        <div className="mt-3 pt-3 border-t border-emerald-500/20">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400">종단간 암호화로 안전하게 보호됨</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateVaultView;
