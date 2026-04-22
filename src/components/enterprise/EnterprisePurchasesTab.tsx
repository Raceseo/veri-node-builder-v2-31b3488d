import { useState } from 'react';
import { Search, Download, Eye, Calendar, Filter, MoreHorizontal, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const EnterprisePurchasesTab = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ✅ 실제 data_purchases 에서 가져오기
  const { data: purchases, isLoading } = useQuery({
    queryKey: ['enterprise-purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('data_purchases')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filteredPurchases = (purchases || []).filter((p) => {
    const matchesSearch = (p.product_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />완료</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30"><Clock className="w-3 h-3 mr-1" />대기중</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30"><XCircle className="w-3 h-3 mr-1" />실패</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30">{status}</Badge>;
    }
  };

  const totalPurchases = (purchases || []).length;
  const totalSpent = (purchases || []).filter(p => p.status === 'completed').reduce((s, p) => s + p.total_price, 0);
  const totalSamples = (purchases || []).filter(p => p.status === 'completed').reduce((s, p) => s + p.unit_count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">구매 내역</h1>
        <p className="text-slate-400 mt-1">데이터셋 구매 및 다운로드 이력을 확인하세요</p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400">총 구매 건수</p>
                <p className="text-3xl font-bold text-white mt-2">{totalPurchases}건</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400">총 지출액</p>
                <p className="text-3xl font-bold text-cyan-400 mt-2">{totalSpent.toLocaleString()} VN</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400">수집된 샘플</p>
                <p className="text-3xl font-bold text-emerald-400 mt-2">{totalSamples.toLocaleString()}명</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 필터 */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="주문번호 또는 데이터셋명 검색..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white">
                <Filter className="w-4 h-4 mr-2" /><SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">전체</SelectItem>
                <SelectItem value="completed" className="text-white">완료</SelectItem>
                <SelectItem value="pending" className="text-white">대기중</SelectItem>
                <SelectItem value="failed" className="text-white">실패</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 테이블 */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="py-16 text-center">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">구매 내역이 없습니다</h3>
              <p className="text-slate-400">데이터 마켓에서 첫 구매를 시작해보세요</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">주문번호</TableHead>
                  <TableHead className="text-slate-400">데이터셋</TableHead>
                  <TableHead className="text-slate-400 text-right">샘플 수</TableHead>
                  <TableHead className="text-slate-400 text-right">금액</TableHead>
                  <TableHead className="text-slate-400">상태</TableHead>
                  <TableHead className="text-slate-400">구매일</TableHead>
                  <TableHead className="text-slate-400 text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((p) => (
                  <TableRow key={p.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-mono text-cyan-400 text-xs">{p.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-white font-medium">{p.product_title || p.product_type}</TableCell>
                    <TableCell className="text-right text-slate-300">{p.unit_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold text-white">{p.total_price.toLocaleString()} VN</TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-slate-400">{new Date(p.created_at || '').toLocaleDateString('ko-KR')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem className="text-slate-300"><Eye className="w-4 h-4 mr-2" />상세 보기</DropdownMenuItem>
                          {p.status === 'completed' && (
                            <DropdownMenuItem className="text-slate-300"><Download className="w-4 h-4 mr-2" />리포트 다운로드</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnterprisePurchasesTab;
