import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Target, Filter, Bell, Save,
  ChevronDown, Check
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCorporatePreferences, CorporatePreference } from '@/hooks/useCorporatePreferences';

interface CorporatePreferencesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingPreferences?: CorporatePreference | null;
}

const INDUSTRIES = ['제조업', '금융', '유통', 'IT', '헬스케어', '교육', '미디어', '서비스업'];
const CATEGORIES = [
  { id: 'consumption', label: '소비 데이터', description: '구매 패턴 및 소비 행동' },
  { id: 'demographics', label: '인구통계', description: '연령, 성별, 지역 분포' },
  { id: 'preferences', label: '선호도', description: '브랜드 및 제품 선호' },
  { id: 'financial', label: '금융 데이터', description: '자산 및 지출 패턴' },
  { id: 'health', label: '건강 데이터', description: '건강 관심사 및 행동' },
  { id: 'lifestyle', label: '라이프스타일', description: '취미, 관심사, 생활 패턴' },
];
const FREQUENCIES = [
  { value: 'monthly', label: '월간' },
  { value: 'quarterly', label: '분기별' },
  { value: 'yearly', label: '연간' },
];

export const CorporatePreferencesSheet: React.FC<CorporatePreferencesSheetProps> = ({
  open,
  onOpenChange,
  existingPreferences,
}) => {
  const { savePreferences } = useCorporatePreferences();
  
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('quarterly');
  const [budgetMin, setBudgetMin] = useState(0);
  const [budgetMax, setBudgetMax] = useState(10000000);
  const [autoNotify, setAutoNotify] = useState(true);

  useEffect(() => {
    if (existingPreferences) {
      setCompanyName(existingPreferences.company_name);
      setIndustry(existingPreferences.industry);
      setSelectedCategories(existingPreferences.preferred_categories);
      setFrequency(existingPreferences.collection_frequency);
      setBudgetMin(existingPreferences.budget_range_min);
      setBudgetMax(existingPreferences.budget_range_max);
      setAutoNotify(existingPreferences.auto_notify);
    }
  }, [existingPreferences]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = () => {
    savePreferences.mutate({
      id: existingPreferences?.id,
      company_name: companyName,
      industry,
      preferred_categories: selectedCategories,
      collection_frequency: frequency,
      budget_range_min: budgetMin,
      budget_range_max: budgetMax,
      auto_notify: autoNotify,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            기업 선호도 설정
          </SheetTitle>
          <SheetDescription>
            업종과 관심 분야를 설정하면 최적의 데이터를 추천받을 수 있습니다
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-20">
          {/* 회사 정보 */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              회사 정보
            </Label>
            <Input
              placeholder="회사명"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="업종 선택" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map(ind => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 선호 카테고리 */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              관심 데이터 분야
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(category => (
                <motion.button
                  key={category.id}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedCategories.includes(category.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:border-primary/50'
                  }`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{category.label}</span>
                    {selectedCategories.includes(category.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 수집 주기 */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              선호 수집 주기
            </Label>
            <div className="flex gap-2">
              {FREQUENCIES.map(freq => (
                <Button
                  key={freq.value}
                  variant={frequency === freq.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFrequency(freq.value)}
                  className="flex-1"
                >
                  {freq.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 예산 범위 */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">예산 범위 (원)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="최소"
                value={budgetMin}
                onChange={(e) => setBudgetMin(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="number"
                placeholder="최대"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {(budgetMin / 10000).toLocaleString()}만원 ~ {(budgetMax / 10000).toLocaleString()}만원
            </p>
          </div>

          {/* 자동 알림 */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">시즌별 자동 알림</p>
                <p className="text-xs text-muted-foreground">
                  적합한 데이터 수집 시기에 알림을 받습니다
                </p>
              </div>
            </div>
            <Switch checked={autoNotify} onCheckedChange={setAutoNotify} />
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button 
            className="w-full" 
            onClick={handleSave}
            disabled={!companyName || !industry || selectedCategories.length === 0 || savePreferences.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {savePreferences.isPending ? '저장 중...' : '선호도 저장'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
