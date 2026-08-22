/**
 * 🔴 **더미 화면. 실데이터 미연결 (B-90).**
 *    2026-08-22 진입점 차단 — 홈 헤더 「기업 공급자 전환 →」 버튼을 제거했다.
 *    Index.tsx 가 SupplierLayout 에 onSwitchToDemand 를 넘기지 않는다.
 *
 * 수요자 화면 7파일(1,805줄) 전부 `supabase.` 호출 0건이다.
 * 화면에 보이는 금액·등급·상품·구매내역·리포트가 모두 상수다.
 * 🔴 되살리기 전 목업 제거 필수 — 첫 의뢰 기업이 자기 것이 아닌 숫자를 보게 된다.
 * 이 파일의 목업: :19 recentReports 상수 배열
 */
import { FileBarChart, TrendingUp, Users, Shield, Star, ChevronRight, Download, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface DemandReportsTabProps {
  onOpenReportDetail?: (reportId: string) => void;
}

const qualityMetrics = {
  avgTrustScore: 84,
  avgPurityScore: 91,
  verifiedRate: 96,
  responseRate: 88,
};

const recentReports = [
  {
    id: "RPT-001",
    purchaseId: "PO-2024-001",
    title: "2030 소비패턴 데이터 품질 리포트",
    generatedAt: "2024-01-16",
    metrics: {
      samples: 1240,
      avgScore: 82,
      gradeA: 45,
      gradeB: 35,
      gradeC: 20,
    },
  },
  {
    id: "RPT-002",
    purchaseId: "PO-2023-045",
    title: "4050 라이프스타일 데이터 품질 리포트",
    generatedAt: "2024-01-10",
    metrics: {
      samples: 890,
      avgScore: 78,
      gradeA: 38,
      gradeB: 42,
      gradeC: 20,
    },
  },
];

const DemandReportsTab = ({ onOpenReportDetail }: DemandReportsTabProps) => {
  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Quality Overview */}
      <Card className="p-4">
        <h2 className="text-lg font-bold text-foreground mb-4">품질 지표 요약</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">평균 신뢰점수</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{qualityMetrics.avgTrustScore}점</p>
            <Progress value={qualityMetrics.avgTrustScore} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">데이터 순도</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{qualityMetrics.avgPurityScore}%</p>
            <Progress value={qualityMetrics.avgPurityScore} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">인증 완료율</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{qualityMetrics.verifiedRate}%</p>
            <Progress value={qualityMetrics.verifiedRate} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">응답 완성률</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{qualityMetrics.responseRate}%</p>
            <Progress value={qualityMetrics.responseRate} className="h-2" />
          </div>
        </div>
      </Card>

      {/* Recent Reports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">최근 품질 리포트</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            전체보기 <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {recentReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => onOpenReportDetail?.(report.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileBarChart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{report.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.purchaseId} · {report.generatedAt}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-sm font-bold text-foreground">{report.metrics.samples.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">샘플</p>
                </div>
                <div className="text-center p-2 bg-emerald-500/10 rounded-lg">
                  <p className="text-sm font-bold text-emerald-600">{report.metrics.gradeA}%</p>
                  <p className="text-xs text-muted-foreground">A등급</p>
                </div>
                <div className="text-center p-2 bg-primary/10 rounded-lg">
                  <p className="text-sm font-bold text-primary">{report.metrics.gradeB}%</p>
                  <p className="text-xs text-muted-foreground">B등급</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-sm font-bold text-foreground">{report.metrics.avgScore}점</p>
                  <p className="text-xs text-muted-foreground">평균</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" className="h-8">
                  <Eye className="w-3 h-3 mr-1" />
                  상세보기
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <Download className="w-3 h-3 mr-1" />
                  PDF
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Anti-Cherry Picker Badge */}
      <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Anti-Cherry Picking 인증</h3>
            <p className="text-xs text-muted-foreground">
              AI가 검증한 무작위 표본 추출로 편향 없는 데이터 보장
            </p>
          </div>
          <Badge className="bg-emerald-500 text-white border-0">인증됨</Badge>
        </div>
      </Card>
    </div>
  );
};

export default DemandReportsTab;
