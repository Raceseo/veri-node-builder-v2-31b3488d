import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  Users, 
  Building2, 
  TrendingUp,
  Shield,
  Sparkles,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PricingBreakdownCardProps {
  basePricePerUnit: number;
  sampleCount: number;
  gradeMultiplier: number;
  urgencyMultiplier: number;
  crossVerificationFee: number;
  totalPrice: number;
  platformFee: number;
  supplierPool: number;
  estimatedPerSupplier: {
    silver: number;
    gold: number;
    platinum: number;
  };
  targetGrade?: string;
  urgency?: string;
  hasCrossVerification?: boolean;
}

const formatKRW = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

export function PricingBreakdownCard({
  basePricePerUnit,
  sampleCount,
  gradeMultiplier,
  urgencyMultiplier,
  crossVerificationFee,
  totalPrice,
  platformFee,
  supplierPool,
  estimatedPerSupplier,
  targetGrade = 'silver',
  urgency = 'normal',
  hasCrossVerification = false,
}: PricingBreakdownCardProps) {
  const platformFeePercent = Math.round((platformFee / totalPrice) * 100);
  const supplierPercent = 100 - platformFeePercent;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">결제 금액 상세</h3>
            <p className="text-sm text-muted-foreground">가격 구성 및 수익 분배</p>
          </div>
        </div>

        <Separator />

        {/* 가격 구성 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            가격 구성
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">기본 단가</span>
              <span className="font-mono">₩{formatKRW(basePricePerUnit)} × {sampleCount}명</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                타겟 정밀도
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
                  {targetGrade.toUpperCase()}
                </Badge>
              </span>
              <span className="font-mono text-primary">×{gradeMultiplier}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                수집 속도
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
                  {urgency === 'urgent' ? '긴급' : urgency === 'fast' ? '빠름' : '일반'}
                </Badge>
              </span>
              <span className="font-mono text-primary">×{urgencyMultiplier}</span>
            </div>
            
            {hasCrossVerification && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  교차검증
                </span>
                <span className="font-mono text-amber-500">+₩{formatKRW(crossVerificationFee)}</span>
              </div>
            )}
          </div>

          <Separator className="my-3" />

          <div className="flex justify-between items-center">
            <span className="font-semibold">총 결제액</span>
            <span className="text-xl font-bold text-primary">₩{formatKRW(totalPrice)}</span>
          </div>
        </div>

        <Separator />

        {/* 수익 분배 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            수익 분배 미리보기
          </h4>

          {/* 분배 비율 바 */}
          <div className="relative h-8 rounded-full overflow-hidden bg-muted">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center"
              initial={{ width: 0 }}
              animate={{ width: `${supplierPercent}%` }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xs font-medium text-white">
                데이터 제공자 {supplierPercent}%
              </span>
            </motion.div>
            <motion.div 
              className="absolute right-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-center"
              initial={{ width: 0 }}
              animate={{ width: `${platformFeePercent}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="text-xs font-medium text-white">
                플랫폼 {platformFeePercent}%
              </span>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400">데이터 제공자</span>
              </div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ₩{formatKRW(supplierPool)}
              </p>
            </div>
            
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600 dark:text-blue-400">플랫폼 운영</span>
              </div>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                ₩{formatKRW(platformFee)}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 공급자 예상 보상 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            1인당 예상 보상
          </h4>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/50 text-center">
              <Badge variant="outline" className="mb-1.5 text-[10px]">SILVER</Badge>
              <p className="font-mono font-semibold">{formatKRW(estimatedPerSupplier.silver)} VN</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <Badge className="mb-1.5 text-[10px] bg-amber-500">GOLD</Badge>
              <p className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                {formatKRW(estimatedPerSupplier.gold)} VN
              </p>
              <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">+25%</p>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
              <Badge className="mb-1.5 text-[10px] bg-purple-500">PLATINUM</Badge>
              <p className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                {formatKRW(estimatedPerSupplier.platinum)} VN
              </p>
              <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70">+50%</p>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            등급에 따라 차등 지급됩니다. 인증 완료 및 프로필 완성도에 따라 등급이 결정됩니다.
          </p>
        </div>
      </div>
    </Card>
  );
}
