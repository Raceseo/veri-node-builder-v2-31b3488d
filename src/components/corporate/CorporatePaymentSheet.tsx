import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, CreditCard, Receipt, CheckCircle, AlertCircle,
  Wallet, FileText, Clock, ChevronRight, Loader2, ArrowLeft, Shield, Lock, XCircle
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CorporatePaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseData?: {
    id: string;
    title: string;
    totalPrice: number;
    unitCount: number;
    unitPrice: number;
    platformFee: number;
    supplierPool: number;
    categories?: string[];
    urgency?: string;
    targetGrade?: string;
  };
  onSuccess?: () => void;
}

type PaymentMethod = 'kakaopay' | 'card' | 'trans' | 'virtual_account';
type Step = 'method' | 'details' | 'confirm' | 'processing' | 'complete' | 'failed';

// PortOne V2 설정
const STORE_ID = 'store-cb3ae162-730e-4c8b-8ad2-b45705bcc3a9';

const CHANNEL_MAP: Record<string, { channelKey: string; payMethod: string }> = {
  kakaopay: {
    channelKey: 'channel-key-c5de175d-e218-4170-a754-35e9d0cee27f',
    payMethod: 'EASY_PAY',
  },
  // 추후 채널키 발급 후 추가
  // card: { channelKey: 'channel-key-xxx', payMethod: 'CARD' },
  // trans: { channelKey: 'channel-key-xxx', payMethod: 'TRANSFER' },
};

const PAYMENT_METHODS = [
  { value: 'kakaopay' as PaymentMethod, label: '카카오페이', icon: Wallet, description: '간편결제', available: true },
  { value: 'card' as PaymentMethod, label: '신용카드 (KG이니시스)', icon: CreditCard, description: '채널키 등록 후 사용 가능', available: false },
  { value: 'trans' as PaymentMethod, label: '계좌이체', icon: Building2, description: '채널키 등록 후 사용 가능', available: false },
  { value: 'virtual_account' as PaymentMethod, label: '가상계좌', icon: FileText, description: '무통장입금 (채널키 필요)', available: false },
];

const VN_TO_KRW = 10;

export const CorporatePaymentSheet: React.FC<CorporatePaymentSheetProps> = ({
  open, onOpenChange, purchaseData, onSuccess,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('kakaopay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [needTaxInvoice, setNeedTaxInvoice] = useState(true);
  const [taxEmail, setTaxEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const krwAmount = (purchaseData?.totalPrice || 0) * VN_TO_KRW;
  const vatAmount = Math.round(krwAmount * 0.1);
  const totalWithVat = krwAmount + vatAmount;

  const handleNextStep = () => {
    if (step === 'method') setStep('details');
    else if (step === 'details') setStep('confirm');
    else if (step === 'confirm') handlePayment();
  };

  const handlePrevStep = () => {
    if (step === 'details') setStep('method');
    else if (step === 'confirm') setStep('details');
  };

  const handlePayment = async () => {
    if (!user?.id || !purchaseData) {
      toast.error('결제 정보가 올바르지 않습니다');
      return;
    }

    // 채널키 확인
    const channelConfig = CHANNEL_MAP[paymentMethod];
    if (!channelConfig) {
      toast.error('해당 결제 수단은 아직 채널키가 등록되지 않았습니다.');
      return;
    }

    setStep('processing');
    setIsProcessing(true);

    try {
      // 1. 서버에서 결제 주문 생성
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-corporate-payment', {
        body: {
          purchaseId: purchaseData.id,
          amount: krwAmount,
          vatAmount,
          totalAmount: totalWithVat,
          paymentMethod,
          needTaxInvoice,
          taxEmail,
        },
      });

      if (orderError || !orderData?.success) {
        throw new Error(orderData?.error || '주문 생성 실패');
      }

      const { orderId, merchantUid } = orderData;
      const paymentId = merchantUid;

      // 2. PortOne V2 SDK 확인
      if (!window.PortOne) {
        throw new Error('결제 모듈을 불러오는 중입니다. 새로고침 후 다시 시도해주세요.');
      }

      // 3. PortOne V2 결제 요청
      const response = await window.PortOne.requestPayment({
        storeId: STORE_ID,
        channelKey: channelConfig.channelKey,
        paymentId,
        orderName: purchaseData.title,
        totalAmount: totalWithVat,
        currency: 'KRW',
        payMethod: channelConfig.payMethod,
        redirectUrl: `${window.location.origin}/payment/complete`,
        customer: {
          email: user.email || undefined,
          fullName: user.user_metadata?.display_name || undefined,
        },
      });

      // 4. 사용자 취소 또는 에러
      if (response.code) {
        setErrorMessage(response.message || '결제가 취소되었습니다.');
        setStep('failed');
        setIsProcessing(false);
        return;
      }

      // 5. 서버에서 결제 검증 + 완료 처리
      const { data: completeData, error: completeError } = await supabase.functions.invoke('complete-corporate-payment', {
        body: {
          orderId,
          paymentId,
          purchaseId: purchaseData.id,
        },
      });

      if (completeError || !completeData?.success) {
        throw new Error(completeData?.error || '결제 검증 실패');
      }

      setStep('complete');
      toast.success('결제가 완료되었습니다!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || '결제 처리 중 오류가 발생했습니다');
      setStep('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (step === 'processing') return;
    setStep('method');
    setPaymentMethod('kakaopay');
    setNeedTaxInvoice(true);
    setTaxEmail('');
    setAgreedToTerms(false);
    setErrorMessage('');
    onOpenChange(false);
  };

  const handleRetry = () => {
    setErrorMessage('');
    setStep('confirm');
  };

  if (!purchaseData) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            기업 결제
          </SheetTitle>
          <SheetDescription>{purchaseData.title}</SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto pb-32">
          <AnimatePresence mode="wait">

            {/* Step 1: 결제 방법 */}
            {step === 'method' && (
              <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">결제 금액</p>
                  <p className="text-3xl font-bold text-primary">₩{totalWithVat.toLocaleString()}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>공급가: ₩{krwAmount.toLocaleString()}</span>
                    <span>•</span>
                    <span>VAT: ₩{vatAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-primary">선불 에스크로 보호</p>
                    <p className="text-xs text-muted-foreground">데이터 수집 완료 후 공급자에게 75% 직접 지급</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">결제 방법</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    {PAYMENT_METHODS.map((method) => (
                      <motion.div
                        key={method.value}
                        whileTap={{ scale: method.available ? 0.98 : 1 }}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          !method.available 
                            ? 'border-border opacity-50 cursor-not-allowed' 
                            : paymentMethod === method.value 
                              ? 'border-primary bg-primary/5 cursor-pointer' 
                              : 'border-border hover:border-primary/50 cursor-pointer'
                        }`}
                        onClick={() => method.available && setPaymentMethod(method.value)}
                      >
                        <RadioGroupItem value={method.value} id={method.value} disabled={!method.available} />
                        <div className={`p-2 rounded-lg ${paymentMethod === method.value && method.available ? 'bg-primary/10' : 'bg-muted'}`}>
                          <method.icon className={`h-5 w-5 ${paymentMethod === method.value && method.available ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{method.label}</p>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                        {!method.available && <Badge variant="outline" className="text-xs">준비중</Badge>}
                      </motion.div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 PortOne V2 기반 결제 시스템입니다. 추가 결제 수단은 채널키 등록 후 활성화됩니다.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: 세부 정보 */}
            {step === 'details' && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <Button variant="ghost" size="sm" onClick={handlePrevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />결제 방법 변경
                </Button>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                    <Checkbox id="tax-invoice" checked={needTaxInvoice} onCheckedChange={(c) => setNeedTaxInvoice(!!c)} />
                    <div className="flex-1">
                      <Label htmlFor="tax-invoice" className="font-medium cursor-pointer">세금계산서 발행</Label>
                      <p className="text-xs text-muted-foreground">결제 완료 후 익일 이내 발행됩니다</p>
                    </div>
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {needTaxInvoice && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                      <Label className="text-sm">세금계산서 수신 이메일</Label>
                      <Input type="email" placeholder="tax@company.com" value={taxEmail} onChange={(e) => setTaxEmail(e.target.value)} />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: 최종 확인 */}
            {step === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <Button variant="ghost" size="sm" onClick={handlePrevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />이전
                </Button>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold">주문 내역</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">상품명</span><span className="font-medium truncate ml-4">{purchaseData.title}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">응답자 수</span><span>{purchaseData.unitCount.toLocaleString()}명</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">공급가</span><span>₩{krwAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">VAT (10%)</span><span>₩{vatAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">공급자 보상 (75%)</span><span className="text-green-600">₩{(purchaseData.supplierPool * VN_TO_KRW).toLocaleString()}</span></div>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-semibold">총 결제금액</span>
                    <span className="text-2xl font-bold text-primary">₩{totalWithVat.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                  <Lock className="h-3 w-3 flex-shrink-0" />
                  <span>금융급 보안 암호화 · 관리자 2인 승인 후 데이터 수집 시작</span>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
                  <Checkbox id="agree-terms" checked={agreedToTerms} onCheckedChange={(c) => setAgreedToTerms(!!c)} />
                  <Label htmlFor="agree-terms" className="text-sm leading-relaxed cursor-pointer">
                    결제 진행에 동의하며, 데이터 구매 약관 및 개인정보 처리방침에 동의합니다.
                  </Label>
                </div>
              </motion.div>
            )}

            {/* Step 4: 처리 중 */}
            {step === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">결제 처리 중</p>
                  <p className="text-sm text-muted-foreground">결제창이 열리면 결제를 진행해주세요.</p>
                </div>
              </motion.div>
            )}

            {/* Step 5: 완료 */}
            {step === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xl font-semibold">결제가 완료되었습니다!</p>
                  <p className="text-muted-foreground mt-2 text-sm">관리자 2인 승인 후 데이터 수집이 시작됩니다</p>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
                  <p className="text-sm font-medium text-primary/80">
                    "데이터의 주인은 나이며, 무상으로 제공하지 않는다"
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 6: 실패 */}
            {step === 'failed' && (
              <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-xl font-semibold">결제 실패</p>
                  <p className="text-muted-foreground mt-2 text-sm">{errorMessage}</p>
                </div>
                <Button className="w-full" variant="outline" onClick={handleRetry}>
                  다시 시도
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {step !== 'processing' && step !== 'complete' && step !== 'failed' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t space-y-2">
            <Button className="w-full" size="lg" onClick={handleNextStep}
              disabled={
                (step === 'details' && needTaxInvoice && !taxEmail) || 
                (step === 'confirm' && !agreedToTerms) || 
                isProcessing ||
                !PAYMENT_METHODS.find(m => m.value === paymentMethod)?.available
              }>
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {step === 'confirm' ? <>₩{totalWithVat.toLocaleString()} 결제하기</> : <>다음 <ChevronRight className="h-4 w-4 ml-2" /></>}
            </Button>
          </div>
        )}

        {(step === 'complete' || step === 'failed') && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
            <Button className="w-full" onClick={handleClose}>닫기</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CorporatePaymentSheet;
