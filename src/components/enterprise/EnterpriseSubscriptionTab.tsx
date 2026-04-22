import { useState } from 'react';
import { CreditCard, Calendar, Check, AlertCircle, Plus, Pause, Play, Settings, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { format, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';

// 샘플 구독 데이터
const sampleSubscriptions = [
  {
    id: 'SUB-001',
    name: 'MZ세대 트렌드 구독',
    categories: ['소비', '금융', '라이프스타일'],
    monthlyBudget: 10000,
    usedBudget: 7500,
    targetSampleCount: 5000,
    collectedSamples: 3800,
    isActive: true,
    autoRenew: true,
    startedAt: new Date('2024-01-01'),
    nextBillingAt: new Date('2024-02-01'),
  },
  {
    id: 'SUB-002',
    name: '금융 서비스 인사이트',
    categories: ['금융', '투자'],
    monthlyBudget: 8000,
    usedBudget: 8000,
    targetSampleCount: 3000,
    collectedSamples: 3000,
    isActive: true,
    autoRenew: true,
    startedAt: new Date('2024-01-15'),
    nextBillingAt: new Date('2024-02-15'),
  },
  {
    id: 'SUB-003',
    name: '건강/웰니스 모니터링',
    categories: ['건강', '피트니스'],
    monthlyBudget: 5000,
    usedBudget: 2000,
    targetSampleCount: 2000,
    collectedSamples: 800,
    isActive: false,
    autoRenew: false,
    startedAt: new Date('2023-12-01'),
    nextBillingAt: null,
  },
];

const EnterpriseSubscriptionTab = () => {
  const [subscriptions, setSubscriptions] = useState(sampleSubscriptions);

  const toggleAutoRenew = (id: string) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, autoRenew: !sub.autoRenew } : sub
    ));
  };

  const activeSubscriptions = subscriptions.filter(s => s.isActive);
  const totalMonthlyBudget = activeSubscriptions.reduce((sum, s) => sum + s.monthlyBudget, 0);
  const totalUsedBudget = activeSubscriptions.reduce((sum, s) => sum + s.usedBudget, 0);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">구독 관리</h1>
          <p className="text-slate-400 mt-1">정기 데이터 구독을 관리하세요</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          새 구독 추가
        </Button>
      </div>

      {/* 구독 요약 */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">월간 예산</p>
                <p className="text-2xl font-bold text-white">{totalMonthlyBudget.toLocaleString()} VN</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">이번 달 사용</p>
                <p className="text-2xl font-bold text-emerald-400">{totalUsedBudget.toLocaleString()} VN</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">활성 구독</p>
                <p className="text-2xl font-bold text-white">{activeSubscriptions.length}개</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 구독 목록 */}
      <div className="space-y-4">
        {subscriptions.map((subscription) => {
          const budgetProgress = (subscription.usedBudget / subscription.monthlyBudget) * 100;
          const sampleProgress = (subscription.collectedSamples / subscription.targetSampleCount) * 100;
          
          return (
            <Card 
              key={subscription.id} 
              className={`bg-slate-900/50 border-slate-800 ${
                !subscription.isActive ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* 좌측: 구독 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{subscription.name}</h3>
                      {subscription.isActive ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          활성
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30">
                          일시정지
                        </Badge>
                      )}
                    </div>

                    {/* 카테고리 */}
                    <div className="flex items-center gap-2 mt-3">
                      {subscription.categories.map((cat) => (
                        <Badge 
                          key={cat} 
                          variant="outline" 
                          className="border-slate-600 text-slate-300"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>

                    {/* 진행 상황 */}
                    <div className="grid grid-cols-2 gap-6 mt-4">
                      {/* 예산 사용 */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-400">예산 사용</span>
                          <span className="text-white">
                            {subscription.usedBudget.toLocaleString()} / {subscription.monthlyBudget.toLocaleString()} VN
                          </span>
                        </div>
                        <Progress value={budgetProgress} className="h-2 bg-slate-800" />
                      </div>

                      {/* 샘플 수집 */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-400">샘플 수집</span>
                          <span className="text-white">
                            {subscription.collectedSamples.toLocaleString()} / {subscription.targetSampleCount.toLocaleString()}명
                          </span>
                        </div>
                        <Progress value={sampleProgress} className="h-2 bg-slate-800" />
                      </div>
                    </div>

                    {/* 다음 결제일 */}
                    {subscription.nextBillingAt && (
                      <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>다음 결제: {format(subscription.nextBillingAt, 'yyyy년 M월 d일', { locale: ko })}</span>
                      </div>
                    )}
                  </div>

                  {/* 우측: 액션 */}
                  <div className="flex flex-col items-end gap-4 ml-6">
                    {/* 자동 갱신 토글 */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">자동 갱신</span>
                      <Switch
                        checked={subscription.autoRenew}
                        onCheckedChange={() => toggleAutoRenew(subscription.id)}
                        disabled={!subscription.isActive}
                      />
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2">
                      {subscription.isActive ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          일시정지
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          재개
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 빈 상태 */}
      {subscriptions.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">구독이 없습니다</h3>
            <p className="text-slate-400 mb-6">정기 데이터 구독을 시작해보세요</p>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              첫 구독 시작하기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnterpriseSubscriptionTab;
