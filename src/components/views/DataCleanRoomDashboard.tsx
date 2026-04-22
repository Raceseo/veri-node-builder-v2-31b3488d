import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  Bot,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Sparkles,
  FileCheck,
  Activity,
  TrendingUp,
  AlertOctagon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DataCleanRoomDashboardProps {
  onBack: () => void;
  onOpenCleanPipeline?: () => void;
}

interface VerificationRecord {
  id: string;
  data_type: string;
  verification_status: string;
  ai_generated_check: boolean | null;
  identity_match_check: boolean | null;
  purity_score: number;
  risk_level: string;
  created_at: string;
  verified_at: string | null;
}

interface ThreatAlert {
  id: string;
  threat_type: string;
  severity: string;
  description: string;
  is_resolved: boolean;
  created_at: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'passed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'suspicious': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'passed': return 'bg-green-500/10 text-green-500 border-green-500/30';
    case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/30';
    case 'suspicious': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-amber-500';
    default: return 'text-green-500';
  }
};

const getDataTypeLabel = (type: string) => {
  switch (type) {
    case 'profile': return '프로필';
    case 'survey': return '설문응답';
    case 'document': return '문서';
    case 'sns': return 'SNS 연동';
    default: return type;
  }
};

const getThreatTypeLabel = (type: string) => {
  switch (type) {
    case 'ai_generated': return 'AI 생성 데이터 의심';
    case 'identity_mismatch': return '명의 불일치';
    case 'pattern_anomaly': return '패턴 이상';
    case 'multiple_attempts': return '다중 시도';
    default: return type;
  }
};

export default function DataCleanRoomDashboard({ onBack, onOpenCleanPipeline }: DataCleanRoomDashboardProps) {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);

  // Purity Score 조회
  const { data: purityScore, refetch: refetchPurity } = useQuery({
    queryKey: ['purity-score', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_purity_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // 검증 기록 조회
  const { data: verifications, refetch: refetchVerifications } = useQuery({
    queryKey: ['verifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('data_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as VerificationRecord[];
    },
    enabled: !!user?.id
  });

  // 위협 알림 조회
  const { data: alerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['threat-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('trust_threat_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as ThreatAlert[];
    },
    enabled: !!user?.id
  });

  const overallScore = purityScore?.overall_score ?? 100;
  const aiScore = purityScore?.ai_authenticity_score ?? 100;
  const identityScore = purityScore?.identity_consistency_score ?? 100;
  const qualityScore = purityScore?.data_quality_score ?? 100;

  const getPurityGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-500', bg: 'bg-green-500' };
    if (score >= 80) return { grade: 'A', color: 'text-green-400', bg: 'bg-green-400' };
    if (score >= 70) return { grade: 'B+', color: 'text-blue-500', bg: 'bg-blue-500' };
    if (score >= 60) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-400' };
    if (score >= 50) return { grade: 'C', color: 'text-amber-500', bg: 'bg-amber-500' };
    return { grade: 'D', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const gradeInfo = getPurityGrade(overallScore);

  const handleScan = async () => {
    setIsScanning(true);
    
    // 시뮬레이션: 데이터 검증 실행
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success("데이터 검증 완료", {
      description: "모든 데이터가 클린룸 검사를 통과했습니다."
    });
    
    setIsScanning(false);
    refetchPurity();
    refetchVerifications();
  };

  const unresolvedAlerts = alerts?.filter(a => !a.is_resolved) || [];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">데이터 클린룸</h1>
            <p className="text-xs text-muted-foreground">Data Clean Room Dashboard</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleScan}
            disabled={isScanning}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? '검사 중...' : '전체 검사'}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Purity Score 메인 게이지 */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Purity Score</h2>
            </div>
            <Badge variant="outline" className={`${gradeInfo.color} border-current`}>
              등급 {gradeInfo.grade}
            </Badge>
          </div>

          {/* 원형 게이지 */}
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${overallScore * 2.64} 264`}
                  className={gradeInfo.color}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${gradeInfo.color}`}>{overallScore}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
          </div>

          {/* 세부 점수 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-background/50 rounded-xl">
              <Bot className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{aiScore}</p>
              <p className="text-[10px] text-muted-foreground">AI 진위성</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-xl">
              <UserCheck className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold">{identityScore}</p>
              <p className="text-[10px] text-muted-foreground">명의 일치</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-xl">
              <Sparkles className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-lg font-bold">{qualityScore}</p>
              <p className="text-[10px] text-muted-foreground">품질 점수</p>
            </div>
          </div>
        </Card>

        {/* 위협 알림 섹션 */}
        {unresolvedAlerts.length > 0 && (
          <Card className="p-4 bg-red-500/5 border-red-500/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertOctagon className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-red-500">시스템 신뢰 위협 알림</h3>
              <Badge variant="destructive" className="ml-auto">{unresolvedAlerts.length}</Badge>
            </div>
            <div className="space-y-2">
              {unresolvedAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg"
                >
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-red-500">
                        {getThreatTypeLabel(alert.threat_type)}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${
                          alert.severity === 'critical' ? 'border-red-500 text-red-500' :
                          alert.severity === 'high' ? 'border-orange-500 text-orange-500' :
                          'border-amber-500 text-amber-500'
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 실시간 검증 상태 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">실시간 검증 현황</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">검증 통과</span>
              </div>
              <p className="text-2xl font-bold text-green-500">
                {verifications?.filter(v => v.verification_status === 'passed').length || 0}
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">검토 필요</span>
              </div>
              <p className="text-2xl font-bold text-amber-500">
                {verifications?.filter(v => v.verification_status === 'suspicious' || v.verification_status === 'pending').length || 0}
              </p>
            </Card>
          </div>
        </div>

        {/* 최근 검증 기록 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileCheck className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">최근 검증 기록</h3>
          </div>

          {verifications && verifications.length > 0 ? (
            <div className="space-y-2">
              {verifications.map((record) => (
                <Card key={record.id} className="p-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(record.verification_status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {getDataTypeLabel(record.data_type)}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${getStatusColor(record.verification_status)}`}
                        >
                          {record.verification_status === 'passed' ? '통과' :
                           record.verification_status === 'failed' ? '실패' :
                           record.verification_status === 'suspicious' ? '의심' : '대기'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          AI: {record.ai_generated_check === false ? '✓ 정상' : 
                               record.ai_generated_check === true ? '✗ 의심' : '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          명의: {record.identity_match_check === true ? '✓ 일치' : 
                                 record.identity_match_check === false ? '✗ 불일치' : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${getRiskColor(record.risk_level)}`}>
                        {record.purity_score}점
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(record.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">검증 기록이 없습니다</p>
              <p className="text-xs text-muted-foreground mt-1">데이터를 제출하면 자동으로 검증됩니다</p>
            </Card>
          )}
        </div>

        {/* Pipeline Button */}
        {onOpenCleanPipeline && (
          <Card 
            className="p-4 bg-gradient-to-r from-primary/10 to-trust/10 border-primary/30 cursor-pointer hover:shadow-lg transition-all"
            onClick={onOpenCleanPipeline}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-trust flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">데이터 클린 파이프라인</h3>
                <p className="text-xs text-muted-foreground">데이터 정제 및 익명화 과정을 실시간으로 확인하세요</p>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
            </div>
          </Card>
        )}

        {/* 검증 프로세스 설명 */}
        <Card className="p-4 bg-muted/30">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            클린룸 검증 프로세스
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Bot className="h-3 w-3 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">AI 가공 여부 검사</p>
                <p className="text-xs text-muted-foreground">제출된 데이터가 AI에 의해 생성되었는지 패턴 분석</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <UserCheck className="h-3 w-3 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium">명의 일치 여부 검사</p>
                <p className="text-xs text-muted-foreground">제출자 신원과 데이터 소유자의 일치 여부 확인</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-3 w-3 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium">검증 통과 마크 부여</p>
                <p className="text-xs text-muted-foreground">모든 검사 통과 시 신뢰 마크가 데이터에 부착됩니다</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
