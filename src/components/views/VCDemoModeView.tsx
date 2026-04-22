import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  Building2, 
  Users, 
  Coins, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'completed';
  details?: string;
}

interface VCDemoModeViewProps {
  onBack: () => void;
}

export const VCDemoModeView = ({ onBack }: VCDemoModeViewProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [demoResult, setDemoResult] = useState<any>(null);
  
  const [steps, setSteps] = useState<DemoStep[]>([
    {
      id: 1,
      title: '기업 데이터 구매 요청',
      description: 'MZ세대 소비패턴 데이터셋 100명 요청',
      icon: <Building2 className="w-5 h-5" />,
      status: 'pending'
    },
    {
      id: 2,
      title: 'AI 공급자 매칭',
      description: '신뢰점수 70+ 공급자 자동 선별',
      icon: <Users className="w-5 h-5" />,
      status: 'pending'
    },
    {
      id: 3,
      title: '데이터 품질 검증',
      description: 'V-Core AI 신뢰도 분석',
      icon: <Shield className="w-5 h-5" />,
      status: 'pending'
    },
    {
      id: 4,
      title: '보상 분배 완료',
      description: '기본 보상 + 품질 보너스 지급',
      icon: <Coins className="w-5 h-5" />,
      status: 'pending'
    }
  ]);

  const runDemo = async () => {
    setIsRunning(true);
    setProgress(0);
    setDemoResult(null);
    
    // Reset steps
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));

    try {
      // Step 1: Corporate Purchase Request
      setCurrentStep(1);
      setSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: 'running' } : s));
      await simulateDelay(1500);
      setProgress(25);
      setSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: 'completed', details: '₩5,000,000 결제 완료' } : s));

      // Step 2: Supplier Matching
      setCurrentStep(2);
      setSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: 'running' } : s));
      await simulateDelay(2000);
      setProgress(50);
      setSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: 'completed', details: '127명 매칭 (평균 신뢰도 78.3)' } : s));

      // Step 3: Quality Verification
      setCurrentStep(3);
      setSteps(prev => prev.map(s => s.id === 3 ? { ...s, status: 'running' } : s));
      await simulateDelay(1500);
      setProgress(75);
      setSteps(prev => prev.map(s => s.id === 3 ? { ...s, status: 'completed', details: '데이터 순도 99.2%' } : s));

      // Step 4: Reward Distribution
      setCurrentStep(4);
      setSteps(prev => prev.map(s => s.id === 4 ? { ...s, status: 'running' } : s));
      
      // Call actual edge function
      const { data, error } = await supabase.functions.invoke('run-vc-demo', {
        body: {
          productType: 'consumption',
          sampleCount: 100,
          totalPrice: 5000000
        }
      });

      if (error) {
        console.error('Demo error:', error);
        // Continue with mock data for demo purposes
      }

      await simulateDelay(1500);
      setProgress(100);
      setSteps(prev => prev.map(s => s.id === 4 ? { ...s, status: 'completed', details: '₩4,250,000 분배 완료' } : s));

      setDemoResult(data || {
        supplierCount: 127,
        totalDistributed: 4250000,
        platformFee: 750000,
        avgReward: 33465,
        qualityScore: 99.2,
        gradeDistribution: { S: 23, A: 45, B: 22, C: 10 }
      });

      toast.success('데모 완료! 전체 거래 사이클이 성공적으로 시연되었습니다.');
    } catch (error) {
      console.error('Demo failed:', error);
      toast.error('데모 실행 중 오류가 발생했습니다.');
    } finally {
      setIsRunning(false);
      setCurrentStep(0);
    }
  };

  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'running': return 'text-primary bg-primary/10 border-primary/30 animate-pulse';
      default: return 'text-muted-foreground bg-muted/50 border-muted';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Rocket className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">VC Demo Mode</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          VeriNode 데이터 거래 사이클 전체 시연
        </p>
      </div>

      {/* Demo Info Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            시연 시나리오
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">상품</p>
              <p className="font-medium text-sm">MZ세대 소비패턴</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">목표 샘플</p>
              <p className="font-medium text-sm">100명</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">결제 금액</p>
              <p className="font-medium text-sm">₩5,000,000</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">예상 시간</p>
              <p className="font-medium text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~10초
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">진행률</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">거래 사이클 단계</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getStepColor(step.status)}`}
            >
              <div className={`p-2 rounded-full ${
                step.status === 'completed' ? 'bg-green-500/20' :
                step.status === 'running' ? 'bg-primary/20' : 'bg-muted'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{step.title}</h4>
                  {step.status === 'running' && (
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      진행중
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                {step.details && (
                  <p className="text-xs text-green-600 mt-1 font-medium">{step.details}</p>
                )}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Result */}
      <AnimatePresence>
        {demoResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  거래 완료 결과
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{demoResult.supplierCount}</p>
                    <p className="text-xs text-muted-foreground">참여 공급자</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{demoResult.qualityScore}%</p>
                    <p className="text-xs text-muted-foreground">데이터 순도</p>
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">비용 분배</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>공급자 보상</span>
                      <span className="font-medium">₩{demoResult.totalDistributed.toLocaleString()} (85%)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>플랫폼 수수료</span>
                      <span className="font-medium">₩{demoResult.platformFee.toLocaleString()} (15%)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">등급 분포</p>
                  <div className="flex gap-2">
                    {Object.entries(demoResult.gradeDistribution).map(([grade, percent]) => (
                      <div key={grade} className="flex-1 text-center">
                        <div className={`text-lg font-bold ${
                          grade === 'S' ? 'text-purple-500' :
                          grade === 'A' ? 'text-blue-500' :
                          grade === 'B' ? 'text-green-500' : 'text-muted-foreground'
                        }`}>
                          {String(percent)}%
                        </div>
                        <p className="text-xs text-muted-foreground">{grade}등급</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">공급자 평균 수익</p>
                  <p className="text-xl font-bold text-primary">₩{demoResult.avgReward.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button */}
      <div className="fixed bottom-20 left-4 right-4">
        <Button
          className="w-full h-14 text-lg"
          size="lg"
          onClick={runDemo}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Rocket className="w-5 h-5 mr-2" />
              </motion.div>
              시연 진행 중...
            </>
          ) : demoResult ? (
            <>
              <TrendingUp className="w-5 h-5 mr-2" />
              다시 시연하기
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5 mr-2" />
              데모 시작
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
