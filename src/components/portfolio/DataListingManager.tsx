import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Play, Pause, Trash2, Eye, Clock, Coins, Users, 
  TrendingUp, AlertCircle, CheckCircle2, Loader2, Plus,
  Calendar, Shield, Target, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow, format, addMonths, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";

interface DataListing {
  id: string;
  title: string;
  description: string | null;
  categories: string[];
  anonymization_level: string;
  allowed_uses: string[];
  include_premium_buyers: boolean;
  sale_duration_months: number;
  expected_monthly_value: number;
  expected_total_value: number;
  actual_earnings: number;
  buyer_count: number;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  started_at: string | null;
  expires_at: string | null;
  paused_at: string | null;
  created_at: string;
}

interface DataListingManagerProps {
  onCreateNew: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  consumption: '소비 패턴',
  asset: '금융 자산',
  mobility: '이동 동선',
  income_stability: '소득/세금',
  health_index: '건강/의료',
  residence_stability: '주거 정보',
  education_level: '학력/자격',
  military_service: '병역 정보',
  professional_qualification: '전문 자격증',
};

const STATUS_CONFIG = {
  pending: { label: '대기중', color: 'bg-amber-100 text-amber-700', icon: Clock },
  active: { label: '판매중', color: 'bg-green-100 text-green-700', icon: Play },
  paused: { label: '일시중지', color: 'bg-slate-100 text-slate-600', icon: Pause },
  completed: { label: '완료', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  cancelled: { label: '취소됨', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function DataListingManager({ onCreateNew }: DataListingManagerProps) {
  const { user } = useAuth();
  const [listings, setListings] = useState<DataListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DataListing | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadListings();
    }
  }, [user?.id]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('data_listings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings((data || []) as DataListing[]);
    } catch (error) {
      console.error('Failed to load listings:', error);
      toast.error('판매 목록을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleStartListing = async (listing: DataListing) => {
    if (!user?.id) return;
    setActionLoading(listing.id);
    
    try {
      const startDate = new Date();
      const expiresAt = addMonths(startDate, listing.sale_duration_months);

      const { error } = await supabase
        .from('data_listings')
        .update({
          status: 'active',
          started_at: startDate.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', listing.id);

      if (error) throw error;
      
      toast.success('판매가 시작되었습니다');
      loadListings();
    } catch (error) {
      console.error('Failed to start listing:', error);
      toast.error('판매 시작에 실패했습니다');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseListing = async (listing: DataListing) => {
    if (!user?.id) return;
    setActionLoading(listing.id);
    
    try {
      const { error } = await supabase
        .from('data_listings')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
        })
        .eq('id', listing.id);

      if (error) throw error;
      
      toast.success('판매가 일시중지되었습니다');
      loadListings();
    } catch (error) {
      console.error('Failed to pause listing:', error);
      toast.error('일시중지에 실패했습니다');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeListing = async (listing: DataListing) => {
    if (!user?.id) return;
    setActionLoading(listing.id);
    
    try {
      const { error } = await supabase
        .from('data_listings')
        .update({
          status: 'active',
          paused_at: null,
        })
        .eq('id', listing.id);

      if (error) throw error;
      
      toast.success('판매가 재개되었습니다');
      loadListings();
    } catch (error) {
      console.error('Failed to resume listing:', error);
      toast.error('재개에 실패했습니다');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteListing = async () => {
    if (!deleteTarget || !user?.id) return;
    setActionLoading(deleteTarget.id);
    
    try {
      const { error } = await supabase
        .from('data_listings')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;
      
      toast.success('판매 등록이 삭제되었습니다');
      setDeleteTarget(null);
      loadListings();
    } catch (error) {
      console.error('Failed to delete listing:', error);
      toast.error('삭제에 실패했습니다');
    } finally {
      setActionLoading(null);
    }
  };

  // Stats
  const activeListings = listings.filter(l => l.status === 'active').length;
  const totalEarnings = listings.reduce((sum, l) => sum + l.actual_earnings, 0);
  const totalBuyers = listings.reduce((sum, l) => sum + l.buyer_count, 0);

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      <Card className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Store className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">내 데이터 마켓</h3>
                <p className="text-xs text-muted-foreground">데이터 판매 현황을 관리하세요</p>
              </div>
            </div>
            <Button size="sm" onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-1" />
              새 판매
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-background/80 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-primary">{activeListings}</p>
              <p className="text-xs text-muted-foreground">활성 판매</p>
            </div>
            <div className="bg-background/80 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-green-600">{totalEarnings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">총 수익 (VN)</p>
            </div>
            <div className="bg-background/80 rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{totalBuyers}</p>
              <p className="text-xs text-muted-foreground">총 구매자</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 판매 목록 */}
      {listings.length > 0 ? (
        <div className="space-y-3">
          {listings.map((listing) => {
            const statusConfig = STATUS_CONFIG[listing.status];
            const StatusIcon = statusConfig.icon;
            const progress = listing.expected_total_value > 0 
              ? Math.floor((listing.actual_earnings / listing.expected_total_value) * 100) 
              : 0;
            const daysRemaining = listing.expires_at 
              ? differenceInDays(new Date(listing.expires_at), new Date())
              : null;

            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{listing.title}</h4>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {listing.categories.slice(0, 3).map(cat => (
                            <Badge key={cat} variant="outline" className="text-xs">
                              {CATEGORY_LABELS[cat] || cat}
                            </Badge>
                          ))}
                          {listing.categories.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{listing.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
                          {listing.actual_earnings.toLocaleString()} VN
                        </p>
                        <p className="text-xs text-muted-foreground">
                          / {listing.expected_total_value.toLocaleString()} VN
                        </p>
                      </div>
                    </div>

                    {/* 진행률 */}
                    {listing.status === 'active' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">진행률</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    )}

                    {/* 정보 */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{listing.buyer_count}명 구매</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <span>
                          {listing.anonymization_level === 'full' ? '완전 익명화' :
                           listing.anonymization_level === 'partial' ? '부분 익명화' : '원본'}
                        </span>
                      </div>
                      {daysRemaining !== null && daysRemaining > 0 && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{daysRemaining}일 남음</span>
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2">
                      {listing.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleStartListing(listing)}
                          disabled={actionLoading === listing.id}
                        >
                          {actionLoading === listing.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              판매 시작
                            </>
                          )}
                        </Button>
                      )}
                      {listing.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                          onClick={() => handlePauseListing(listing)}
                          disabled={actionLoading === listing.id}
                        >
                          {actionLoading === listing.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              일시중지
                            </>
                          )}
                        </Button>
                      )}
                      {listing.status === 'paused' && (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleResumeListing(listing)}
                          disabled={actionLoading === listing.id}
                        >
                          {actionLoading === listing.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              재개
                            </>
                          )}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setDeleteTarget(listing)}
                        disabled={actionLoading === listing.id}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4">
              아직 등록된 데이터 판매가 없습니다
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-1" />
              첫 판매 등록하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>판매 등록을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" 판매 등록이 영구적으로 삭제됩니다. 
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteListing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
