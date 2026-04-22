import { useState } from "react";
import { Lock, Shield, Heart, CreditCard, Briefcase, Home, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SensitiveInfoConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (consents: ConsentState) => void;
}

interface ConsentState {
  health: boolean;
  finance: boolean;
  property: boolean;
  income: boolean;
}

interface CategoryItem {
  id: keyof ConsentState;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const categories: CategoryItem[] = [
  {
    id: 'health',
    name: '건강 정보',
    description: '진료 기록, 처방약 복용 내역',
    icon: Heart,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-500/10'
  },
  {
    id: 'finance',
    name: '금융 신용 정보',
    description: '신용등급, 부채 및 대출 현황',
    icon: CreditCard,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10'
  },
  {
    id: 'property',
    name: '자산 정보',
    description: '부동산, 차량 소유 내역',
    icon: Home,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10'
  },
  {
    id: 'income',
    name: '소득 정보',
    description: '연간 소득, 세금 납부 기록',
    icon: Briefcase,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10'
  }
];

export const SensitiveInfoConsentModal = ({
  isOpen,
  onClose,
  onConfirm,
}: SensitiveInfoConsentModalProps) => {
  const [consents, setConsents] = useState<ConsentState>({
    health: false,
    finance: false,
    property: false,
    income: false,
  });

  const toggleConsent = (id: keyof ConsentState) => {
    setConsents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(consents).filter(Boolean).length;

  const handleConfirm = () => {
    onConfirm(consents);
    // Reset state
    setConsents({
      health: false,
      finance: false,
      property: false,
      income: false,
    });
  };

  const handleClose = () => {
    setConsents({
      health: false,
      finance: false,
      property: false,
      income: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* White Card Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center bg-gradient-to-b from-blue-50 to-white">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            🔒 보안 강화 및 민감정보 보호 안내
          </h2>
          <p className="text-sm text-gray-500">
            안전한 데이터 관리를 위한 동의가 필요해요
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Easy Explanation */}
          <div className="mb-6 space-y-3">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-blue-600">선생님의 소중한 정보</span>(건강, 부채 등)는 
                  <span className="font-semibold text-blue-600"> 더 큰 보상</span>을 위해 사용되며, 
                  암호화되어 안전하게 관리됩니다.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  해당 데이터는 분석 즉시 <span className="font-semibold text-emerald-600">비식별 처리(익명화)</span>되며, 
                  <span className="font-semibold text-emerald-600"> 개인 식별 정보는 저장되지 않습니다.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Category Switches */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              동의할 정보를 선택하세요
            </p>
            <div className="space-y-3">
              {categories.map((category) => {
                const Icon = category.icon;
                const isChecked = consents[category.id];
                
                return (
                  <div
                    key={category.id}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all duration-200",
                      isChecked
                        ? "bg-blue-50 border-blue-300"
                        : "bg-gray-50 border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        category.iconBg
                      )}>
                        <Icon className={cn("w-6 h-6", category.iconColor)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                          <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            보상 3배
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>

                      <Switch
                        checked={isChecked}
                        onCheckedChange={() => toggleConsent(category.id)}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Count */}
          {selectedCount > 0 && (
            <div className="mb-4 p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-violet-700">선택된 항목</span>
                <span className="text-lg font-bold text-violet-600">{selectedCount}개</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className={cn(
                "w-full h-14 rounded-2xl font-bold text-base transition-all",
                selectedCount > 0
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              <Shield className="w-5 h-5 mr-2" />
              선택한 정보로 안전하게 시작하기
            </Button>

            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full h-12 rounded-2xl font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              나중에 하기
            </Button>
          </div>

          {/* Legal Notice */}
          <p className="mt-4 text-[10px] text-gray-400 text-center leading-relaxed">
            개인정보보호법 제23조에 따라 민감정보 처리에 대한 별도 동의를 받습니다.
            <br />
            동의하신 정보는 언제든지 설정에서 철회할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SensitiveInfoConsentModal;
