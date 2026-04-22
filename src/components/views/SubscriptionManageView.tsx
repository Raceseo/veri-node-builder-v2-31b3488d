import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Crown, 
  CreditCard, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  amount: number;
  billing_cycle: string;
  next_billing_date: string | null;
  last_billing_date: string | null;
  auto_renew: boolean;
  customer_uid: string | null;
  created_at: string;
}

interface SubscriptionManageViewProps {
  onBack?: () => void;
}

const SubscriptionManageView = ({ onBack }: SubscriptionManageViewProps) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSubscription(data as Subscription | null);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRenew = async () => {
    if (!subscription) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          auto_renew: !subscription.auto_renew,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription({ ...subscription, auto_renew: !subscription.auto_renew });
      toast({
        title: subscription.auto_renew ? '자동 갱신 해제' : '자동 갱신 활성화',
        description: subscription.auto_renew 
          ? '다음 결제일에 자동 갱신되지 않습니다.'
          : '다음 결제일에 자동으로 갱신됩니다.',
      });
    } catch (error) {
      console.error('Failed to update auto_renew:', error);
      toast({
        title: '설정 변경 실패',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return;
    if (!confirm('정말 구독을 해지하시겠습니까? 다음 결제일까지는 서비스를 이용하실 수 있습니다.')) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription({ ...subscription, status: 'cancelled', auto_renew: false });
      toast({
        title: '구독 해지 완료',
        description: '다음 결제일까지 서비스를 이용하실 수 있습니다.',
      });
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast({
        title: '구독 해지 실패',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getPlanDetails = (planType: string) => {
    const plans: Record<string, { name: string; features: string[] }> = {
      basic: {
        name: 'Basic',
        features: ['기본 데이터 판매', '월 5회 인출', '이메일 지원'],
      },
      pro: {
        name: 'Pro',
        features: ['프리미엄 구매자 매칭', '무제한 인출', '우선 지원', '고급 분석'],
      },
      enterprise: {
        name: 'Enterprise',
        features: ['전용 계정 관리자', 'API 접근', '맞춤형 분석', 'SLA 보장'],
      },
    };
    return plans[planType] || plans.basic;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-600 border-0"><CheckCircle className="w-3 h-3 mr-1" /> 활성</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-0"><AlertTriangle className="w-3 h-3 mr-1" /> 일시정지</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/20 text-gray-600 border-0">해지됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h2 className="text-xl font-bold">구독 관리</h2>
          <p className="text-sm text-muted-foreground">멤버십 상태를 관리하세요</p>
        </div>
      </div>

      {!subscription ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">구독 중인 멤버십이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4">
              멤버십에 가입하여 프리미엄 혜택을 누려보세요
            </p>
            <Button>
              <Crown className="w-4 h-4 mr-2" />
              멤버십 가입하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 현재 플랜 */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getPlanDetails(subscription.plan_type).name} 멤버십
                      {getStatusBadge(subscription.status)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {subscription.billing_cycle === 'yearly' ? '연간' : '월간'} 구독
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">₩{subscription.amount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    /{subscription.billing_cycle === 'yearly' ? '년' : '월'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getPlanDetails(subscription.plan_type).features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 결제 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                결제 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">다음 결제일</span>
                <span className="font-medium">
                  {subscription.next_billing_date 
                    ? format(new Date(subscription.next_billing_date), 'yyyy년 M월 d일', { locale: ko })
                    : '-'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">마지막 결제일</span>
                <span>
                  {subscription.last_billing_date 
                    ? format(new Date(subscription.last_billing_date), 'yyyy년 M월 d일', { locale: ko })
                    : '-'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">결제 수단</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  {subscription.customer_uid ? '등록된 카드' : '미등록'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 자동 갱신 설정 */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">자동 갱신</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.auto_renew 
                      ? '다음 결제일에 자동으로 갱신됩니다'
                      : '다음 결제일에 구독이 종료됩니다'
                    }
                  </p>
                </div>
                <Switch
                  checked={subscription.auto_renew}
                  onCheckedChange={toggleAutoRenew}
                  disabled={updating || subscription.status === 'cancelled'}
                />
              </div>
            </CardContent>
          </Card>

          {/* 구독 해지 */}
          {subscription.status === 'active' && (
            <Card className="border-destructive/30">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-destructive">구독 해지</p>
                    <p className="text-sm text-muted-foreground">
                      다음 결제일까지 서비스 이용 가능
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={cancelSubscription}
                    disabled={updating}
                  >
                    해지하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* VeriNode 철학 */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        데이터 주인은 나, 무상 제공 금지 — VeriNode
      </p>
    </div>
  );
};

export default SubscriptionManageView;
