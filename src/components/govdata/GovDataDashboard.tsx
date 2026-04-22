import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2, Heart, Home, GraduationCap, Shield, Award,
  TrendingUp, Database, ChevronRight, RefreshCw, Loader2,
  CheckCircle2, AlertCircle, Coins
} from 'lucide-react';
import GovDataConnectionSheet from './GovDataConnectionSheet';

interface Analysis {
  id: string;
  analysis_type: string;
  score: number;
  grade: string;
  details_json: Record<string, any>;
  data_value_raw: number;
  data_value_refined: number;
  analysis_date: string;
}

interface Connection {
  id: string;
  agency_code: string;
  agency_name: string;
  agency_type: string;
  is_connected: boolean;
  connected_at: string;
  last_synced_at: string;
}

interface Summary {
  total_categories: number;
  average_score: number;
  data_value_raw: number;
  data_value_refined: number;
  overall_grade: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  income_stability: <Building2 className="w-5 h-5" />,
  health_index: <Heart className="w-5 h-5" />,
  residence_stability: <Home className="w-5 h-5" />,
  education_level: <GraduationCap className="w-5 h-5" />,
  military_service: <Shield className="w-5 h-5" />,
  professional_qualification: <Award className="w-5 h-5" />,
};

const TYPE_LABELS: Record<string, string> = {
  income_stability: '소득 안정성',
  health_index: '건강 지수',
  residence_stability: '주거 안정성',
  education_level: '학력 수준',
  military_service: '병역 상태',
  professional_qualification: '전문 자격',
};

const TYPE_COLORS: Record<string, string> = {
  income_stability: 'text-blue-600',
  health_index: 'text-red-500',
  residence_stability: 'text-green-600',
  education_level: 'text-purple-600',
  military_service: 'text-slate-600',
  professional_qualification: 'text-amber-600',
};

const GRADE_COLORS: Record<string, string> = {
  S: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900',
  A: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  B: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  C: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  D: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function GovDataDashboard() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analysisRes, connectionsRes] = await Promise.all([
        supabase.functions.invoke('gov-data-sync', {
          body: { action: 'get_analysis' }
        }),
        supabase.functions.invoke('gov-data-sync', {
          body: { action: 'get_connections' }
        }),
      ]);

      if (analysisRes.data) {
        setAnalyses(analysisRes.data.analyses || []);
        setSummary(analysisRes.data.summary || null);
      }
      if (connectionsRes.data) {
        setConnections(connectionsRes.data.connections || []);
      }
    } catch (error: any) {
      console.error('데이터 로드 실패:', error);
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await loadData();
      toast.success('데이터가 동기화되었습니다');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = analyses.length > 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            정부 마이데이터
          </h2>
          <p className="text-sm text-muted-foreground">
            공공기관 인증 데이터로 신뢰도 향상
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            동기화
          </Button>
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            기관 연동
          </Button>
        </div>
      </div>

      {!hasData ? (
        /* 빈 상태 */
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">아직 연동된 정부 데이터가 없습니다</h3>
          <p className="text-sm text-muted-foreground mb-4">
            정부 기관을 연동하여 신뢰도를 높이고 데이터 가치를 극대화하세요
          </p>
          <Button onClick={() => setSheetOpen(true)}>
            <Building2 className="w-4 h-4 mr-2" />
            정부 기관 연동하기
          </Button>
        </Card>
      ) : (
        <>
          {/* 종합 요약 카드 */}
          {summary && (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">종합 데이터 등급</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className={`text-lg px-3 py-1 ${GRADE_COLORS[summary.overall_grade]}`}>
                        {summary.overall_grade}
                      </Badge>
                      <span className="text-2xl font-bold">{summary.average_score}점</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">연동 카테고리</p>
                    <p className="text-2xl font-bold text-primary">{summary.total_categories}개</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/80 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Database className="w-4 h-4" />
                      <span className="text-xs">원본 데이터 가치</span>
                    </div>
                    <p className="text-xl font-bold">{summary.data_value_raw.toLocaleString()} VN</p>
                  </div>
                  <div className="bg-background/80 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs">정제 후 가치</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {summary.data_value_refined.toLocaleString()} VN
                    </p>
                    <p className="text-xs text-green-600">
                      +{((summary.data_value_refined / summary.data_value_raw - 1) * 100).toFixed(0)}% 향상
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 카테고리별 분석 */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">카테고리별 분석</h3>
            {analyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={TYPE_COLORS[analysis.analysis_type]}>
                        {TYPE_ICONS[analysis.analysis_type]}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">
                          {TYPE_LABELS[analysis.analysis_type] || analysis.analysis_type}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(analysis.analysis_date).toLocaleDateString('ko-KR')} 분석
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={GRADE_COLORS[analysis.grade]}>{analysis.grade}</Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <Progress value={analysis.score} className="h-2 mb-2" />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{analysis.score}점</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <Coins className="w-3 h-3" />
                      {analysis.data_value_refined.toLocaleString()} VN
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* 연결된 기관 목록 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground">연동된 기관</h3>
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setSheetOpen(true)}>
                기관 추가
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {connections.map(conn => (
                <Badge 
                  key={conn.id} 
                  variant="outline"
                  className="gap-2 py-1.5 px-3"
                >
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  {conn.agency_name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 상세 분석 모달 */}
      {selectedAnalysis && (
        <AnalysisDetailSheet 
          analysis={selectedAnalysis} 
          onClose={() => setSelectedAnalysis(null)} 
        />
      )}

      {/* 연동 시트 */}
      <GovDataConnectionSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen}
        onConnectionSuccess={loadData}
      />
    </div>
  );
}

// 분석 상세 시트 컴포넌트
function AnalysisDetailSheet({ 
  analysis, 
  onClose 
}: { 
  analysis: Analysis; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={onClose}>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl bg-muted ${TYPE_COLORS[analysis.analysis_type]}`}>
            {TYPE_ICONS[analysis.analysis_type]}
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {TYPE_LABELS[analysis.analysis_type] || analysis.analysis_type}
            </h2>
            <p className="text-sm text-muted-foreground">상세 분석 결과</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">점수</p>
            <p className="text-2xl font-bold">{analysis.score}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">등급</p>
            <Badge className={`text-lg ${GRADE_COLORS[analysis.grade]}`}>{analysis.grade}</Badge>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">데이터 가치</p>
            <p className="text-lg font-bold text-green-600">{analysis.data_value_refined} VN</p>
          </Card>
        </div>

        <Card className="p-4 mb-6">
          <h3 className="font-medium mb-3">분석 세부사항</h3>
          <div className="space-y-2">
            {Object.entries(analysis.details_json || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{key}</span>
                <span className="text-sm font-medium">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Button className="w-full" onClick={onClose}>닫기</Button>
      </motion.div>
    </div>
  );
}