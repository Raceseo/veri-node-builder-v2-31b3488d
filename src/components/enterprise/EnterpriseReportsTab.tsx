import { useState } from 'react';
import { Search, Download, FileText, Eye, Calendar, BarChart3, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const EnterpriseReportsTab = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ 실제 transaction_reports 에서 가져오기
  const { data: reports, isLoading } = useQuery({
    queryKey: ['enterprise-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transaction_reports')
        .select('*')
        .eq('buyer_id', user.id)
        .order('generated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filteredReports = (reports || []).filter((r) =>
    r.report_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">리포트 센터</h1>
          <p className="text-slate-400 mt-1">구매한 데이터의 리포트를 확인하세요</p>
        </div>
      </div>

      {/* 검색 */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="리포트 검색..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
        </CardContent>
      </Card>

      {/* 리포트 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">리포트가 없습니다</h3>
            <p className="text-slate-400">데이터를 구매하면 리포트가 자동 생성됩니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{report.report_number}</h3>
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                      <span>공급자: {report.total_suppliers}명</span>
                      <span>분배: {(report.total_distributed || 0).toLocaleString()} VN</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.generated_at || '').toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                        <Eye className="w-4 h-4 mr-2" />상세 보기
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnterpriseReportsTab;
