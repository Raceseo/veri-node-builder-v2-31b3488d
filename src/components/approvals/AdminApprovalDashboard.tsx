import { Shield, Check, X, AlertTriangle, Lock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataAccessRequests } from '@/hooks/useDataAccessRequests';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion } from 'framer-motion';

const adminStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return <Badge className="bg-warning/10 text-warning border-warning/30">1차 승인 대기</Badge>;
    case 'first_approved': return <Badge className="bg-trust/10 text-trust border-trust/30">2차 승인 대기</Badge>;
    case 'completed': return <Badge className="bg-success/10 text-success border-success/30">승인 완료</Badge>;
    case 'rejected': return <Badge variant="destructive">거절됨</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
};

export const AdminApprovalDashboard = () => {
  const { requests, isLoading, adminApprove, adminReject } = useDataAccessRequests('admin');

  const pendingAdmin = requests.filter(r =>
    r.supplier_status === 'approved' &&
    (r.admin_status === 'pending' || r.admin_status === 'first_approved')
  );
  const completedAdmin = requests.filter(r =>
    r.admin_status === 'completed' || r.admin_status === 'rejected'
  );

  if (isLoading) {
    return (
      <Card className="border-0 shadow-card">
        <CardHeader><CardTitle>관리자 승인</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 보안 안내 */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-primary" />
          <span className="font-semibold text-primary">2인 관리자 승인 시스템</span>
        </div>
        <p className="text-sm text-muted-foreground">
          민감한 데이터 내보내기는 반드시 서로 다른 두 명의 관리자가 승인해야 처리됩니다.
          본인 승인 및 동일인 이중 승인은 자동으로 차단됩니다.
        </p>
      </div>

      {/* 대기 건 */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              승인 대기
            </div>
            {pendingAdmin.length > 0 && <Badge variant="destructive">{pendingAdmin.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingAdmin.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
              대기 중인 승인 건이 없습니다
            </div>
          ) : (
            pendingAdmin.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border bg-card space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    {adminStatusLabel(req.admin_status)}
                    <p className="text-sm mt-2">
                      카테고리: {(req.data_categories || []).join(', ')}
                    </p>
                    <p className="text-sm font-semibold mt-1">{req.offered_price.toLocaleString()} VN</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ko })}
                  </p>
                </div>

                {req.admin_status === 'first_approved' && req.first_admin_id && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-trust/5 border border-trust/10 text-xs text-trust">
                    <Users className="w-4 h-4" />
                    1차 승인 완료 — 2차 승인자가 필요합니다 (동일인 불가)
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => adminApprove.mutate({ requestId: req.id })}
                    disabled={adminApprove.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {req.admin_status === 'pending' ? '1차 승인' : '2차 승인 (최종)'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => adminReject.mutate({ requestId: req.id })}
                    disabled={adminReject.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    거절
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 처리 완료 */}
      {completedAdmin.length > 0 && (
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-success" />
              처리 완료
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedAdmin.slice(0, 10).map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  {adminStatusLabel(req.admin_status)}
                  <span className="text-sm">{(req.data_categories || []).join(', ')}</span>
                </div>
                <span className="text-sm font-medium">{req.offered_price.toLocaleString()} VN</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
