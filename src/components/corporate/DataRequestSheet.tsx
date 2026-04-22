import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Users, Target, Filter, Clock, DollarSign,
  ChevronRight, Check, Info, AlertCircle
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { SeasonalTemplate } from '@/hooks/useCorporatePreferences';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CorporatePaymentSheet } from './CorporatePaymentSheet';

interface DataRequestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: SeasonalTemplate | null;
  onClearTemplate: () => void;
}

const URGENCY_OPTIONS = [
  { value: 'normal', label: '일반', days: 14, multiplier: 1.0 },
  { value: 'fast', label: '빠른', days: 7, multiplier: 1.3 },
  { value: 'urgent', label: '긴급', days: 3, multiplier: 1.8 },
];

const GRADE_OPTIONS = [
  { value: 'silver', label: 'Silver', multiplier: 1.0 },
  { value: 'gold', label: 'Gold', multiplier: 1.5 },
  { value: 'platinum', label: 'Platinum', multiplier: 2.2 },
];

const ALL_CATEGORIES = [
  { id: 'consumption', label: '소비 데이터' },
  { id: 'demographics', label: '인구통계' },
  { id: 'preferences', label: '선호도' },
  { id: 'financial', label: '금융 데이터' },
  { id: 'health', label: '건강 데이터' },
  { id: 'lifestyle', label: '라이프스타일' },
  { id: 'environmental', label: '환경' },
  { id: 'social', label: '사회' },
  { id: 'governance', label: '거버넌스' },
];

export const DataRequestSheet: React.FC<DataRequestSheetProps> = ({
  open,
  onOpenChange,
  template,
  onClearTemplate,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [createdPurchase, setCreatedPurchase] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState(template?.template_name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    template?.recommended_categories || ['consumption', 'demographics']
  );
  const [sampleCount, setSampleCount] = useState(template?.typical_sample_size || 500);
  const [targetGrade, setTargetGrade] = useState('silver');
  const [urgency, setUrgency] = useState(template?.urgency_level || 'normal');

  // Update form when template changes
  React.useEffect(() => {
    if (template) {
      setTitle(template.template_name);
      setDescription(template.description || '');
      setSelectedCategories(template.recommended_categories);
      setSampleCount(template.typical_sample_size);
      setUrgency(template.urgency_level);
    }
  }, [template]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  // 가격 계산
  const pricing = useMemo(() => {
    const basePrice = 500; // VN per sample
    const gradeMultiplier = GRADE_OPTIONS.find(g => g.value === targetGrade)?.multiplier || 1;
    const urgencyMultiplier = URGENCY_OPTIONS.find(u => u.value === urgency)?.multiplier || 1;
    const categoryMultiplier = 1 + (selectedCategories.length - 1) * 0.08;
    
    const unitPrice = Math.round(basePrice * gradeMultiplier * urgencyMultiplier * categoryMultiplier);
    const totalPrice = unitPrice * sampleCount;
    const platformFee = Math.round(totalPrice * 0.25);
    const supplierPool = totalPrice - platformFee;

    return { unitPrice, totalPrice, platformFee, supplierPool };
  }, [sampleCount, targetGrade, urgency, selectedCategories]);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다');
      return;
    }

    if (!title || selectedCategories.length === 0) {
      toast.error('필수 항목을 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('data_purchases').insert({
        buyer_id: user.id,
        product_type: 'survey',
        product_title: title,
        unit_count: sampleCount,
        unit_price: pricing.unitPrice,
        total_price: pricing.totalPrice,
        platform_fee: pricing.platformFee,
        supplier_pool: pricing.supplierPool,
        target_grade: targetGrade,
        urgency: urgency,
        has_cross_verification: true,
        price_breakdown: {
          categories: selectedCategories,
          description,
          template_id: template?.id || null,
        },
        status: 'pending',
      }).select().single();

      if (error) throw error;

      // 결제 시트로 이동
      setCreatedPurchase({
        id: data.id,
        title,
        totalPrice: pricing.totalPrice,
        unitCount: sampleCount,
        unitPrice: pricing.unitPrice,
        platformFee: pricing.platformFee,
        supplierPool: pricing.supplierPool,
        categories: selectedCategories,
        urgency,
        targetGrade,
      });
      setShowPaymentSheet(true);
    } catch (error) {
      console.error('Request error:', error);
      toast.error('요청 등록에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('결제가 완료되었습니다');
    setShowPaymentSheet(false);
    onOpenChange(false);
    onClearTemplate();
    
    // Reset form
    setTitle('');
    setDescription('');
    setSelectedCategories(['consumption', 'demographics']);
    setSampleCount(500);
    setTargetGrade('silver');
    setUrgency('normal');
    setCreatedPurchase(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      onClearTemplate();
    }
    onOpenChange(open);
  };

  const deliveryDays = URGENCY_OPTIONS.find(u => u.value === urgency)?.days || 14;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {template ? '템플릿 기반 요청' : '맞춤 데이터 요청'}
          </SheetTitle>
          <SheetDescription>
            {template 
              ? '템플릿을 바탕으로 세부 사항을 조정하세요'
              : '원하는 조건으로 데이터 수집을 요청하세요'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-40">
          {/* 템플릿 표시 */}
          {template && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">
                  "{template.template_name}" 템플릿 적용됨
                </span>
              </div>
            </div>
          )}

          {/* 제목 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">요청 제목</Label>
            <Input
              placeholder="예: 2024 Q1 소비자 트렌드 분석"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">상세 설명 (선택)</Label>
            <Textarea
              placeholder="수집하고자 하는 데이터의 목적과 활용 계획을 설명해주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* 카테고리 선택 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              데이터 카테고리
            </Label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map(cat => (
                <Badge
                  key={cat.id}
                  variant={selectedCategories.includes(cat.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(cat.id)}
                >
                  {selectedCategories.includes(cat.id) && <Check className="h-3 w-3 mr-1" />}
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* 샘플 수 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                목표 응답자 수
              </Label>
              <span className="text-lg font-bold text-primary">{sampleCount.toLocaleString()}명</span>
            </div>
            <Slider
              value={[sampleCount]}
              onValueChange={([v]) => setSampleCount(v)}
              min={100}
              max={10000}
              step={100}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>100명</span>
              <span>10,000명</span>
            </div>
          </div>

          {/* 등급 선택 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              데이터 품질 등급
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {GRADE_OPTIONS.map(grade => (
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
                  <p className="font-medium text-sm">{grade.label}</p>
                  <p className="text-xs text-muted-foreground">x{grade.multiplier}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 긴급도 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              수집 긴급도
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {URGENCY_OPTIONS.map(opt => (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    urgency === opt.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setUrgency(opt.value)}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.days}일 이내</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 가격 요약 */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              예상 비용
            </h4>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">단가</span>
                <span>{pricing.unitPrice.toLocaleString()} VN/명</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">응답자 수</span>
                <span>{sampleCount.toLocaleString()}명</span>
              </div>
              <div className="border-t my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">플랫폼 수수료 (25%)</span>
                <span>{pricing.platformFee.toLocaleString()} VN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">공급자 보상 풀</span>
                <span>{pricing.supplierPool.toLocaleString()} VN</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">총 예상 비용</span>
                <span className="text-2xl font-bold text-primary">
                  {pricing.totalPrice.toLocaleString()} VN
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                약 {(pricing.totalPrice / 100).toLocaleString()}원
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 rounded-lg p-2">
              <Clock className="h-3 w-3" />
              <span>예상 완료일: {deliveryDays}일 이내</span>
            </div>
          </div>

          {/* 안내 */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              요청 등록 후 결제를 진행하시면 AI 기반 샘플 수집이 시작됩니다. 
              수집 진행 상황은 실시간으로 확인하실 수 있습니다.
            </p>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t space-y-2">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubmit}
            disabled={!title || selectedCategories.length === 0 || isSubmitting}
          >
            {isSubmitting ? '요청 등록 중...' : '결제하고 데이터 요청하기'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            ₩{(pricing.totalPrice * 10 * 1.1).toLocaleString()} (VAT 포함)
          </p>
        </div>
      </SheetContent>

      {/* 기업 결제 시트 */}
      <CorporatePaymentSheet
        open={showPaymentSheet}
        onOpenChange={setShowPaymentSheet}
        purchaseData={createdPurchase}
        onSuccess={handlePaymentSuccess}
      />
    </Sheet>
  );
};
