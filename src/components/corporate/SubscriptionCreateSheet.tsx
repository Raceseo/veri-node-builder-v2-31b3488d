import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, Calendar, Target, Users, DollarSign,
  Check, ArrowRight
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useCorporatePreferences } from '@/hooks/useCorporatePreferences';
import { format, addMonths, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface SubscriptionCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferenceId?: string;
}

const SUBSCRIPTION_TYPES = [
  { value: 'monthly', label: '월간', description: '매월 정기 수집', icon: Calendar },
  { value: 'quarterly', label: '분기별', description: '3개월마다 수집', icon: RefreshCw },
  { value: 'yearly', label: '연간', description: '연 1회 종합 수집', icon: Target },
];

const GRADES = [
  { value: 'silver', label: 'Silver', multiplier: 1.0, color: 'bg-gray-400' },
  { value: 'gold', label: 'Gold', multiplier: 1.5, color: 'bg-amber-400' },
  { value: 'platinum', label: 'Platinum', multiplier: 2.2, color: 'bg-gradient-to-r from-purple-400 to-pink-400' },
];

const CATEGORIES = [
  'consumption', 'demographics', 'preferences', 'financial', 'health', 'lifestyle'
];

const CATEGORY_LABELS: Record<string, string> = {
  consumption: '소비',
  demographics: '인구통계',
  preferences: '선호도',
  financial: '금융',
  health: '건강',
  lifestyle: '라이프스타일',
};

export const SubscriptionCreateSheet: React.FC<SubscriptionCreateSheetProps> = ({
  open,
  onOpenChange,
  preferenceId,
}) => {
  const { createSubscription, preferences } = useCorporatePreferences();
  
  const [subscriptionType, setSubscriptionType] = useState('quarterly');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    preferences?.preferred_categories || ['consumption', 'demographics']
  );
  const [sampleCount, setSampleCount] = useState(500);
  const [targetGrade, setTargetGrade] = useState('silver');
  const [monthlyBudget, setMonthlyBudget] = useState(1000000);
  const [autoRenew, setAutoRenew] = useState(true);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const calculateNextDate = () => {
    const today = new Date();
    switch (subscriptionType) {
      case 'monthly':
        return addMonths(today, 1);
      case 'quarterly':
        return addMonths(today, 3);
      case 'yearly':
        return addMonths(today, 12);
      default:
        return addMonths(today, 3);
    }
  };

  const estimatedPrice = () => {
    const basePrice = 500; // VN per sample
    const gradeMultiplier = GRADES.find(g => g.value === targetGrade)?.multiplier || 1;
    const categoryMultiplier = 1 + (selectedCategories.length - 1) * 0.1;
    return Math.round(sampleCount * basePrice * gradeMultiplier * categoryMultiplier);
  };

  const handleCreate = () => {
    createSubscription.mutate({
      preference_id: preferenceId || undefined,
      subscription_type: subscriptionType,
      categories: selectedCategories,
      target_sample_count: sampleCount,
      target_grade: targetGrade,
      monthly_budget: monthlyBudget,
      next_collection_date: calculateNextDate().toISOString().split('T')[0],
      auto_renew: autoRenew,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            정기 구독 생성
          </SheetTitle>
          <SheetDescription>
            원하는 주기로 자동 데이터 수집을 설정하세요
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-32">
          {/* 구독 유형 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">수집 주기</Label>
            <div className="grid grid-cols-3 gap-2">
              {SUBSCRIPTION_TYPES.map(type => (
                <motion.button
                  key={type.value}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    subscriptionType === type.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSubscriptionType(type.value)}
                >
                  <type.icon className={`h-5 w-5 mx-auto mb-1 ${
                    subscriptionType === type.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">데이터 카테고리</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Badge
                  key={cat}
                  variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(cat)}
                >
                  {selectedCategories.includes(cat) && <Check className="h-3 w-3 mr-1" />}
                  {CATEGORY_LABELS[cat]}
                </Badge>
              ))}
            </div>
          </div>

          {/* 샘플 수 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                목표 샘플 수
              </Label>
              <span className="text-lg font-bold text-primary">{sampleCount.toLocaleString()}명</span>
            </div>
            <Slider
              value={[sampleCount]}
              onValueChange={([v]) => setSampleCount(v)}
              min={100}
              max={5000}
              step={100}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>100명</span>
              <span>5,000명</span>
            </div>
          </div>

          {/* 등급 선택 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">목표 데이터 등급</Label>
            <div className="grid grid-cols-3 gap-2">
              {GRADES.map(grade => (
                <motion.button
                  key={grade.value}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    targetGrade === grade.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setTargetGrade(grade.value)}
                >
                  <div className={`h-3 w-3 rounded-full ${grade.color} mx-auto mb-2`} />
                  <p className="font-medium text-sm">{grade.label}</p>
                  <p className="text-xs text-muted-foreground">x{grade.multiplier}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 월 예산 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              월 예산 한도
            </Label>
            <Input
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {(monthlyBudget / 10000).toLocaleString()}만원
            </p>
          </div>

          {/* 자동 갱신 */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">자동 갱신</p>
              <p className="text-xs text-muted-foreground">
                구독 기간 종료 시 자동으로 갱신합니다
              </p>
            </div>
            <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
          </div>

          {/* 요약 */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              구독 요약
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">다음 수집일</p>
                <p className="font-medium">
                  {format(calculateNextDate(), 'yyyy년 M월 d일', { locale: ko })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">예상 비용</p>
                <p className="font-medium text-primary">
                  {estimatedPrice().toLocaleString()} VN
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 생성 버튼 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button 
            className="w-full" 
            onClick={handleCreate}
            disabled={selectedCategories.length === 0 || createSubscription.isPending}
          >
            {createSubscription.isPending ? '생성 중...' : '구독 시작하기'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
