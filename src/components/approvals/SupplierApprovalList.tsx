import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Shield, Clock, AlertTriangle, Coins, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataAccessRequests } from '@/hooks/useDataAccessRequests';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const statusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30"><Clock className="w-3 h-3 mr-1" />대기 중</Badge>;
    case 'approved':
      return <Badge className="bg-success/10 text-success border-success/30"><Check className="w-3 h-3 mr-1" />승인됨</Badge>;
    case 'rejected':
      return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />거절됨</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const SupplierApprovalList = () => {
  const { requests, isLoading, supplierRespond } = useDataAccessRequests('supplier');

  const pendingRequests = requests.filter(r => r.supplier_status === 'pending');
  const historyRequests = requests.filter(r => r.supplier_status !== 'pending');

  if (isLoading) {
    return (
      <Card className="border-0 shadow-card">
        <CardHeader><CardTitle className="text-lg">승인 요청</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 대기 중인 요청 */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              승인 대기 요청
            </div>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
              대기 중인 승인 요청이 없습니다
            </div>
          ) : (
            <AnimatePresence>
              {pendingRequests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="p-4 rounded-xl border bg-warning/5 border-warning/20 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {req.request_type === 'sensitive_export' ? '민감 데이터' : '일반 데이터'}
                        </Badge>
                        {statusBadge(req.supplier_status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        카테고리: {(req.data_categories || []).join(', ') || '없음'}
                      </p>
                      {req.message && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{req.message}"</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-success font-semibold">
                        <Coins className="w-4 h-4" />
                        {req.offered_price.toLocaleString()} VN
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ko })}
                      </p>
                    </div>
                  </div>

                  {req.request_type === 'sensitive_export' && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 text-xs text-primary">
                      <Shield className="w-4 h-4" />
                      승인 후 관리자 2인 추가 승인이 필요합니다
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => supplierRespond.mutate({ requestId: req.id, decision: 'approved' })}
                      disabled={supplierRespond.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => supplierRespond.mutate({ requestId: req.id, decision: 'rejected' })}
                      disabled={supplierRespond.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      거절
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* 처리 이력 */}
      {historyRequests.length > 0 && (
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              처리 이력
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {historyRequests.slice(0, 10).map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <div className="flex items-center gap-2">
                    {statusBadge(req.final_status)}
                    <span className="text-xs text-muted-foreground">
                      {(req.data_categories || []).join(', ')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{req.offered_price.toLocaleString()} VN</span>
                  <p className="text-xs text-muted-foreground">
                    {req.completed_at
                      ? formatDistanceToNow(new Date(req.completed_at), { addSuffix: true, locale: ko })
                      : '진행 중'}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
