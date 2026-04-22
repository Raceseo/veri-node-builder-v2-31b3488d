import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Mail, 
  CheckCircle2,
  Users,
  Shield,
  Coins,
  TrendingUp,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TransactionReport {
  id: string;
  reportNumber: string;
  purchaseId: string;
  productTitle: string;
  buyerName: string;
  totalPrice: number;
  platformFee: number;
  supplierPool: number;
  totalSuppliers: number;
  avgTrustScore: number;
  gradeDistribution: Record<string, number>;
  qualityMetrics: {
    dataPurity: number;
    completionRate: number;
    verificationRate: number;
  };
  costBreakdown: {
    baseAmount: number;
    qualityBonus: number;
    platformFee: number;
  };
  generatedAt: string;
}

interface TransactionReportViewProps {
  onBack: () => void;
  reportId?: string;
}

export const TransactionReportView = ({ onBack, reportId }: TransactionReportViewProps) => {
  const [reports, setReports] = useState<TransactionReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<TransactionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch completed purchases with their payouts
      const { data: purchases, error } = await supabase
        .from('data_purchases')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Generate demo reports for each purchase or create mock data
      const mockReports: TransactionReport[] = purchases?.length 
        ? purchases.map(p => ({
            id: p.id,
            reportNumber: `TXN-${format(new Date(p.created_at || ''), 'yyyy-MMdd')}-${p.id.slice(0, 4).toUpperCase()}`,
            purchaseId: p.id,
            productTitle: p.product_title || 'MZ세대 소비패턴 데이터셋',
            buyerName: 'ACME Corp',
            totalPrice: p.total_price,
            platformFee: p.platform_fee,
            supplierPool: p.supplier_pool,
            totalSuppliers: p.unit_count,
            avgTrustScore: 78.3,
            gradeDistribution: { S: 23, A: 45, B: 22, C: 10 },
            qualityMetrics: {
              dataPurity: 99.2,
              completionRate: 98.5,
              verificationRate: 100
            },
            costBreakdown: {
              baseAmount: p.supplier_pool * 0.7,
              qualityBonus: p.supplier_pool * 0.3,
              platformFee: p.platform_fee
            },
            generatedAt: p.completed_at || p.created_at || ''
          }))
        : [
          {
            id: '1',
            reportNumber: 'TXN-2026-0114-0001',
            purchaseId: 'demo-1',
            productTitle: 'MZ세대 소비패턴 데이터셋',
            buyerName: 'ACME Corp',
            totalPrice: 5000000,
            platformFee: 750000,
            supplierPool: 4250000,
            totalSuppliers: 127,
            avgTrustScore: 78.3,
            gradeDistribution: { S: 23, A: 45, B: 22, C: 10 },
            qualityMetrics: {
              dataPurity: 99.2,
              completionRate: 98.5,
              verificationRate: 100
            },
            costBreakdown: {
              baseAmount: 2975000,
              qualityBonus: 1275000,
              platformFee: 750000
            },
            generatedAt: new Date().toISOString()
          },
          {
            id: '2',
            reportNumber: 'TXN-2026-0113-0002',
            purchaseId: 'demo-2',
            productTitle: '금융 소비자 신용 분석 데이터',
            buyerName: 'FinTech Solutions',
            totalPrice: 8500000,
            platformFee: 1275000,
            supplierPool: 7225000,
            totalSuppliers: 215,
            avgTrustScore: 82.1,
            gradeDistribution: { S: 28, A: 42, B: 20, C: 10 },
            qualityMetrics: {
              dataPurity: 99.5,
              completionRate: 99.1,
              verificationRate: 100
            },
            costBreakdown: {
              baseAmount: 5057500,
              qualityBonus: 2167500,
              platformFee: 1275000
            },
            generatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];

      setReports(mockReports);
      if (mockReports.length > 0) {
        setSelectedReport(mockReports[0]);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    toast.success('PDF 다운로드가 시작됩니다.');
    // In production, this would generate and download a PDF
  };

  const handleSendEmail = () => {
    toast.success('이메일로 리포트가 전송되었습니다.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          거래 완료 리포트
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          데이터 품질 인증 및 정산 내역
        </p>
      </div>

      {/* Report List */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">최근 리포트</p>
        {reports.map((report) => (
          <Card 
            key={report.id}
            className={`cursor-pointer transition-colors ${
              selectedReport?.id === report.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => setSelectedReport(report)}
          >
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{report.reportNumber}</p>
                <p className="text-xs text-muted-foreground">{report.productTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  ₩{(report.totalPrice / 10000).toFixed(0)}만
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Report Detail */}
      {selectedReport && (
        <>
          {/* Report Header */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Report ID</CardTitle>
                <Badge className="bg-green-500/20 text-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  완료
                </Badge>
              </div>
              <p className="text-lg font-bold">{selectedReport.reportNumber}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">상품명</p>
                  <p className="font-medium">{selectedReport.productTitle}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">구매자</p>
                  <p className="font-medium">{selectedReport.buyerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">거래일시</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(selectedReport.generatedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">총 결제액</p>
                  <p className="font-medium text-primary">₩{selectedReport.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Certification */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                데이터 품질 인증
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Users className="w-5 h-5 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">{selectedReport.totalSuppliers}</p>
                  <p className="text-xs text-muted-foreground">총 수집</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-lg font-bold">{selectedReport.avgTrustScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">평균 신뢰도</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Shield className="w-5 h-5 mx-auto text-green-500 mb-1" />
                  <p className="text-lg font-bold text-green-600">{selectedReport.qualityMetrics.dataPurity}%</p>
                  <p className="text-xs text-muted-foreground">데이터 순도</p>
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">등급 분포</p>
                {Object.entries(selectedReport.gradeDistribution).map(([grade, percent]) => (
                  <div key={grade} className="flex items-center gap-3">
                    <span className={`w-8 text-sm font-bold ${
                      grade === 'S' ? 'text-purple-500' :
                      grade === 'A' ? 'text-blue-500' :
                      grade === 'B' ? 'text-green-500' : 'text-amber-500'
                    }`}>{grade}</span>
                    <div className="flex-1">
                      <Progress 
                        value={percent} 
                        className={`h-2 ${
                          grade === 'S' ? '[&>div]:bg-purple-500' :
                          grade === 'A' ? '[&>div]:bg-blue-500' :
                          grade === 'B' ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500'
                        }`}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-medium">{percent}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                비용 분배
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                <div>
                  <p className="text-sm">공급자 보상 총액</p>
                  <p className="text-xs text-muted-foreground">기본 + 품질 보너스</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">₩{selectedReport.supplierPool.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">85%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm">플랫폼 수수료</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₩{selectedReport.platformFee.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">15%</p>
                </div>
              </div>

              {/* Per-Grade Breakdown */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">등급별 정산 예시</p>
                <div className="bg-muted/30 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-2 p-2 bg-muted/50 text-xs font-medium">
                    <span>등급</span>
                    <span className="text-center">인원</span>
                    <span className="text-center">기본</span>
                    <span className="text-center">보너스</span>
                  </div>
                  {[
                    { grade: 'S', count: Math.round(selectedReport.totalSuppliers * 0.23), base: 2500, bonus: 750 },
                    { grade: 'A', count: Math.round(selectedReport.totalSuppliers * 0.45), base: 2500, bonus: 500 },
                    { grade: 'B', count: Math.round(selectedReport.totalSuppliers * 0.22), base: 2500, bonus: 250 },
                    { grade: 'C', count: Math.round(selectedReport.totalSuppliers * 0.10), base: 2500, bonus: 0 },
                  ].map((item) => (
                    <div key={item.grade} className="grid grid-cols-4 gap-2 p-2 text-sm border-t border-muted">
                      <span className={`font-medium ${
                        item.grade === 'S' ? 'text-purple-500' :
                        item.grade === 'A' ? 'text-blue-500' :
                        item.grade === 'B' ? 'text-green-500' : 'text-amber-500'
                      }`}>{item.grade}등급</span>
                      <span className="text-center">{item.count}명</span>
                      <span className="text-center">₩{item.base.toLocaleString()}</span>
                      <span className="text-center text-green-600">+₩{item.bonus.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF 다운로드
            </Button>
            <Button onClick={handleSendEmail}>
              <Mail className="w-4 h-4 mr-2" />
              이메일 전송
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
