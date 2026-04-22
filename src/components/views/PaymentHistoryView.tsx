import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  ChevronRight, 
  Receipt, 
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PaymentOrder {
  id: string;
  order_type: string;
  amount: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface PaymentHistoryViewProps {
  onBack?: () => void;
}

const PaymentHistoryView = ({ onBack }: PaymentHistoryViewProps) => {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders((data as PaymentOrder[]) || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: '결제 내역 조회 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-600 border-0"><CheckCircle className="w-3 h-3 mr-1" /> 완료</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-0"><Clock className="w-3 h-3 mr-1" /> 대기</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-500/20 text-gray-600 border-0"><RefreshCw className="w-3 h-3 mr-1" /> 환불</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-600 border-0"><XCircle className="w-3 h-3 mr-1" /> 실패</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOrderTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      vn_charge: 'VN 충전',
      subscription: '멤버십 구독',
      membership: '멤버십',
      data_purchase: '데이터 구매',
      one_time: '일반 결제',
    };
    return typeMap[type] || type;
  };

  const getPaymentMethodName = (method: string | null) => {
    if (!method) return '-';
    const methodMap: Record<string, string> = {
      card: '신용카드',
      kakaopay: '카카오페이',
      naverpay: '네이버페이',
      tosspay: '토스페이',
      trans: '계좌이체',
      phone: '휴대폰',
      billing_key: '자동결제',
    };
    return methodMap[method] || method;
  };

  const handleRefundRequest = async (orderId: string) => {
    if (!confirm('환불을 요청하시겠습니까?')) return;

    setRefundingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          orderId,
          reason: '고객 요청',
          reasonCategory: 'customer_request',
        },
      });

      if (error) throw error;

      toast({
        title: '환불 요청 완료',
        description: data.message || '환불 요청이 접수되었습니다.',
      });

      fetchOrders(); // 새로고침
    } catch (error) {
      console.error('Refund request failed:', error);
      toast({
        title: '환불 요청 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setRefundingId(null);
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
          <h2 className="text-xl font-bold">결제 내역</h2>
          <p className="text-sm text-muted-foreground">모든 결제 기록을 확인하세요</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">결제 내역이 없습니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{getOrderTypeName(order.order_type)}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ₩{order.total_amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span>{getPaymentMethodName(order.payment_method)}</span>
                      <span>•</span>
                      <span>
                        {order.paid_at 
                          ? format(new Date(order.paid_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : format(new Date(order.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {order.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefundRequest(order.id)}
                        disabled={refundingId === order.id}
                      >
                        {refundingId === order.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>환불 요청</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* 상세 정보 (VAT 등) */}
                <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>공급가액</span>
                    <span>₩{order.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>부가세</span>
                    <span>₩{order.vat_amount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* VeriNode 철학 */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        데이터 주인은 나, 무상 제공 금지 — VeriNode
      </p>
    </div>
  );
};

export default PaymentHistoryView;
