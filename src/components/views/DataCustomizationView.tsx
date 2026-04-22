import { useState, useEffect } from "react";
import { ArrowLeft, Check, Info, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

interface DataCustomizationViewProps {
  onBack: () => void;
  onComplete: () => void;
}

interface DataItem {
  id: string;
  label: string;
  description: string;
  value: number;
  category: string;
}

const dataItems: DataItem[] = [
  { id: "health_insurance", label: "건강보험공단 재직 정보", description: "직장 및 소득 정보 연동", value: 15000, category: "employment" },
  { id: "sns_activity", label: "SNS 활동 내역", description: "소셜 미디어 데이터 연동", value: 12000, category: "social" },
  { id: "education", label: "학력 정보", description: "학력 및 전공 정보", value: 8000, category: "education" },
  { id: "finance", label: "금융 정보", description: "신용 및 자산 정보", value: 20000, category: "finance" },
  { id: "consumption", label: "소비 패턴 데이터", description: "구매 및 결제 내역", value: 18000, category: "consumption" },
  { id: "location", label: "위치 기반 데이터", description: "이동 패턴 및 방문 기록", value: 10000, category: "location" },
  { id: "health", label: "건강 데이터", description: "웨어러블 및 건강 기록", value: 25000, category: "health" },
  { id: "interests", label: "관심사 프로필", description: "취미 및 관심 분야", value: 5000, category: "interests" },
];

type Grade = "Bronze" | "Silver" | "Gold" | "Diamond" | "Platinum";

interface GradeInfo {
  name: Grade;
  minItems: number;
  color: string;
  bgColor: string;
  surveys: number;
}

const grades: GradeInfo[] = [
  { name: "Bronze", minItems: 0, color: "#CD7F32", bgColor: "bg-[#CD7F32]", surveys: 5 },
  { name: "Silver", minItems: 2, color: "#C0C0C0", bgColor: "bg-[#C0C0C0]", surveys: 15 },
  { name: "Gold", minItems: 4, color: "#FFD700", bgColor: "bg-[#FFD700]", surveys: 30 },
  { name: "Diamond", minItems: 6, color: "#B9F2FF", bgColor: "bg-gradient-to-r from-[#A8EDEA] to-[#FED6E3]", surveys: 50 },
  { name: "Platinum", minItems: 8, color: "#E5E4E2", bgColor: "bg-gradient-to-r from-[#E8E8E8] via-[#F5F5F5] to-[#C0C0C0]", surveys: 100 },
];

const DataCustomizationView = ({ onBack, onComplete }: DataCustomizationViewProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [displayedEarnings, setDisplayedEarnings] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalEarnings = selectedItems.reduce((sum, id) => {
    const item = dataItems.find(i => i.id === id);
    return sum + (item?.value || 0);
  }, 0);

  const currentGrade = grades.reduce((prev, curr) => {
    return selectedItems.length >= curr.minItems ? curr : prev;
  }, grades[0]);

  const nextGrade = grades.find(g => g.minItems > selectedItems.length);

  // Animate earnings change
  useEffect(() => {
    if (displayedEarnings !== totalEarnings) {
      setIsAnimating(true);
      const diff = totalEarnings - displayedEarnings;
      const step = diff > 0 ? Math.ceil(diff / 20) : Math.floor(diff / 20);
      const interval = setInterval(() => {
        setDisplayedEarnings(prev => {
          const next = prev + step;
          if ((step > 0 && next >= totalEarnings) || (step < 0 && next <= totalEarnings)) {
            clearInterval(interval);
            setIsAnimating(false);
            return totalEarnings;
          }
          return next;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [totalEarnings, displayedEarnings]);

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleComplete = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "항목을 선택해주세요",
        description: "최소 1개 이상의 정보를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "✅ 설정 완료!",
      description: `${currentGrade.name} 등급으로 수익 창출이 시작됩니다.`,
    });
    onComplete();
  };

  const gradeProgress = (selectedItems.length / 8) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-border">
        <button onClick={onBack} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">데이터 커스터마이징</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Grade Visualization */}
        <div className="p-6 border-b border-border">
          <div className="text-center mb-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${currentGrade.bgColor} text-foreground font-bold text-lg shadow-lg transition-all duration-500`}
                 style={{ color: currentGrade.name === "Bronze" || currentGrade.name === "Gold" ? "#000" : "#333" }}>
              <Sparkles className="w-5 h-5" />
              {currentGrade.name}
            </div>
            <p className="text-muted-foreground text-sm mt-2">
              참여 가능 설문: <span className="text-primary font-bold">{currentGrade.surveys}개</span>
            </p>
          </div>

          {/* Grade Progress Bar */}
          <div className="relative">
            <div className="flex justify-between mb-2">
              {grades.map((grade, index) => (
                <div key={grade.name} className="flex flex-col items-center" style={{ width: `${100 / grades.length}%` }}>
                  <div 
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      selectedItems.length >= grade.minItems 
                        ? grade.bgColor + " border-transparent shadow-md scale-110" 
                        : "bg-muted border-border"
                    }`}
                  />
                  <span className={`text-xs mt-1 transition-colors ${
                    selectedItems.length >= grade.minItems ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}>
                    {grade.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#CD7F32] via-[#FFD700] to-[#E5E4E2] transition-all duration-500 ease-out"
                style={{ width: `${Math.min(gradeProgress, 100)}%` }}
              />
            </div>
            {nextGrade && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                다음 등급까지 <span className="text-primary font-bold">{nextGrade.minItems - selectedItems.length}개</span> 더 선택
              </p>
            )}
          </div>
        </div>

        {/* Earnings Display */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">나의 예상 월 수익</p>
                <div className={`text-2xl font-bold text-primary transition-all duration-300 ${isAnimating ? "scale-110" : "scale-100"}`}>
                  {displayedEarnings.toLocaleString()}원
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">선택한 항목</p>
              <p className="text-lg font-bold text-foreground">{selectedItems.length} / {dataItems.length}</p>
            </div>
          </div>
        </div>

        {/* Data Items Checklist */}
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">정보 제공 설정</h3>
          
          {dataItems.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleItemToggle(item.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  isSelected 
                    ? "bg-primary border-primary" 
                    : "border-muted-foreground/30"
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
                
                <div className="flex-1 text-left">
                  <p className={`font-medium ${isSelected ? "text-foreground" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                
                <div className={`text-right transition-all ${isSelected ? "scale-110" : ""}`}>
                  <p className={`font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                    +{item.value.toLocaleString()}원
                  </p>
                  <p className="text-xs text-muted-foreground">/월</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Notice */}
        <div className="mx-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              <span className="font-bold text-amber-600">정보를 더 많이 연동할수록</span> 기업들이 선호하는 
              <span className="font-bold text-amber-600"> 고단가 설문에 우선 매칭</span>됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          onClick={handleComplete}
          disabled={selectedItems.length === 0}
          className="w-full h-14 rounded-xl text-base font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          이 설정으로 수익 창출 시작하기
        </Button>
        {selectedItems.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            예상 월 수익: <span className="text-primary font-bold">{totalEarnings.toLocaleString()}원</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default DataCustomizationView;
