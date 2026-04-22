import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  UserCheck, 
  Bot, 
  Fingerprint, 
  ScanFace, 
  Smartphone,
  Monitor,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
  PieChart
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

interface DataQualityReportViewProps {
  onBack: () => void;
}

// Biometric authentication types with icons
const biometricTypes = [
  { type: "windows_hello", label: "Windows Hello", icon: Monitor, color: "#0078D4" },
  { type: "fingerprint", label: "지문 인증", icon: Fingerprint, color: "#10B981" },
  { type: "face_id", label: "Face ID", icon: ScanFace, color: "#8B5CF6" },
  { type: "mobile_bio", label: "모바일 생체", icon: Smartphone, color: "#F59E0B" },
];

// Mock data for demonstration
const authenticationRateData = [
  { month: "1월", naturalPerson: 92, aiBlocked: 8 },
  { month: "2월", naturalPerson: 94, aiBlocked: 6 },
  { month: "3월", naturalPerson: 91, aiBlocked: 9 },
  { month: "4월", naturalPerson: 96, aiBlocked: 4 },
  { month: "5월", naturalPerson: 95, aiBlocked: 5 },
  { month: "6월", naturalPerson: 97, aiBlocked: 3 },
];

const aiBlockHistoryData = [
  { date: "6/25", blocked: 12, attempts: 150 },
  { date: "6/26", blocked: 8, attempts: 142 },
  { date: "6/27", blocked: 15, attempts: 168 },
  { date: "6/28", blocked: 5, attempts: 135 },
  { date: "6/29", blocked: 9, attempts: 155 },
  { date: "6/30", blocked: 7, attempts: 148 },
  { date: "7/1", blocked: 4, attempts: 160 },
];

const biometricDistribution = [
  { name: "Windows Hello", value: 35, color: "#0078D4" },
  { name: "지문 인증", value: 40, color: "#10B981" },
  { name: "Face ID", value: 15, color: "#8B5CF6" },
  { name: "모바일 생체", value: 10, color: "#F59E0B" },
];

const datasetList = [
  { 
    id: 1, 
    name: "서울 MZ세대 소비 패턴", 
    records: 15420, 
    naturalPersonRate: 98.2, 
    aiBlockCount: 12,
    biometrics: ["fingerprint", "face_id"],
    purityScore: 96
  },
  { 
    id: 2, 
    name: "30-40대 금융 선호도", 
    records: 8750, 
    naturalPersonRate: 97.8, 
    aiBlockCount: 8,
    biometrics: ["windows_hello", "fingerprint"],
    purityScore: 94
  },
  { 
    id: 3, 
    name: "전국 여행 트렌드 2024", 
    records: 22100, 
    naturalPersonRate: 99.1, 
    aiBlockCount: 5,
    biometrics: ["mobile_bio", "fingerprint", "face_id"],
    purityScore: 98
  },
  { 
    id: 4, 
    name: "헬스케어 앱 사용 현황", 
    records: 12340, 
    naturalPersonRate: 96.5, 
    aiBlockCount: 18,
    biometrics: ["fingerprint"],
    purityScore: 91
  },
];

export default function DataQualityReportView({ onBack }: DataQualityReportViewProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);

  // Fetch verification data from database
  const { data: verificationStats } = useQuery({
    queryKey: ['verification-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_verifications')
        .select('*');
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const passed = data?.filter(v => v.verification_status === 'verified').length || 0;
      const aiChecked = data?.filter(v => v.ai_generated_check === false).length || 0;
      const identityMatched = data?.filter(v => v.identity_match_check === true).length || 0;
      
      return {
        total,
        passed,
        aiChecked,
        identityMatched,
        passRate: total > 0 ? (passed / total * 100).toFixed(1) : 0,
        aiRate: total > 0 ? (aiChecked / total * 100).toFixed(1) : 0,
        identityRate: total > 0 ? (identityMatched / total * 100).toFixed(1) : 0,
      };
    }
  });

  const handleDownloadCertificate = async (datasetId?: number) => {
    setIsGeneratingPDF(true);
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a simple PDF-like content (in production, use a proper PDF library)
    const certificateContent = `
=====================================
    데이터 청정도 보증서
    VeriNode Data Purity Certificate
=====================================

발급일: ${new Date().toLocaleDateString('ko-KR')}
인증번호: VN-${Date.now().toString(36).toUpperCase()}

${datasetId ? `데이터셋: ${datasetList.find(d => d.id === datasetId)?.name}` : '전체 데이터셋'}

■ 품질 지표
- 자연인 인증 비율: ${datasetId ? datasetList.find(d => d.id === datasetId)?.naturalPersonRate : 97.2}%
- AI 생성 데이터 차단율: 100%
- 데이터 청정도 점수: ${datasetId ? datasetList.find(d => d.id === datasetId)?.purityScore : 95}/100

■ 인증 내역
- 생체 인증 완료
- 명의 일치 검증 완료
- AI 가공 여부 검사 완료

이 보증서는 VeriNode의 데이터 검증 시스템에 의해
자동으로 생성되었습니다.

=====================================
    `;
    
    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VeriNode_청정도보증서_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsGeneratingPDF(false);
    toast.success("데이터 청정도 보증서가 다운로드되었습니다");
  };

  const getBiometricIcon = (type: string) => {
    const biometric = biometricTypes.find(b => b.type === type);
    if (!biometric) return null;
    const Icon = biometric.icon;
    return (
      <div 
        key={type}
        className="flex items-center justify-center w-8 h-8 rounded-full"
        style={{ backgroundColor: `${biometric.color}20` }}
        title={biometric.label}
      >
        <Icon className="w-4 h-4" style={{ color: biometric.color }} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">데이터 품질 리포트</h1>
              <p className="text-xs text-muted-foreground">Data Quality Report for Enterprise</p>
            </div>
          </div>
          <Button 
            onClick={() => handleDownloadCertificate()}
            disabled={isGeneratingPDF}
            className="gap-2"
          >
            {isGeneratingPDF ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                보증서 다운로드
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-muted-foreground">자연인 인증률</span>
              </div>
              <div className="text-2xl font-bold text-emerald-500">97.2%</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-500">+2.1% 이번 달</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-rose-500" />
                <span className="text-sm text-muted-foreground">AI 차단 건수</span>
              </div>
              <div className="text-2xl font-bold text-rose-500">47건</div>
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span className="text-xs text-rose-500">이번 주 차단</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Authentication Rate Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                자연인 인증 비율 추이
              </CardTitle>
              <Badge variant="outline" className="text-xs">최근 6개월</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={authenticationRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="naturalPerson" name="자연인 인증" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aiBlocked" name="AI 차단" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Block History */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-rose-500" />
                AI 차단 이력
              </CardTitle>
              <Badge variant="destructive" className="text-xs">실시간 모니터링</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiBlockHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="attempts" 
                    name="총 시도" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="blocked" 
                    name="차단됨" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Biometric Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-primary" />
              생체 인증 방식 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={biometricDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                    >
                      {biometricDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {biometricTypes.map(({ type, label, icon: Icon, color }) => {
                  const data = biometricDistribution.find(d => d.name === label);
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{label}</span>
                          <span className="font-medium">{data?.value || 0}%</span>
                        </div>
                        <Progress value={data?.value || 0} className="h-1.5 mt-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dataset List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              데이터셋별 품질 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {datasetList.map((dataset) => (
              <div 
                key={dataset.id}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedDataset === dataset.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedDataset(
                  selectedDataset === dataset.id ? null : dataset.id
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-foreground">{dataset.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {dataset.records.toLocaleString()}개 레코드
                    </p>
                  </div>
                  <Badge 
                    variant={dataset.purityScore >= 95 ? "default" : "secondary"}
                    className={dataset.purityScore >= 95 ? "bg-emerald-500" : ""}
                  >
                    {dataset.purityScore}점
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <UserCheck className="w-3 h-3" />
                      자연인 인증
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={dataset.naturalPersonRate} className="h-2 flex-1" />
                      <span className="text-sm font-medium text-emerald-500">
                        {dataset.naturalPersonRate}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Bot className="w-3 h-3" />
                      AI 차단
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span className="text-sm font-medium text-rose-500">
                        {dataset.aiBlockCount}건
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-2">인증 방식:</span>
                    {dataset.biometrics.map(type => getBiometricIcon(type))}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadCertificate(dataset.id);
                    }}
                  >
                    <Download className="w-3 h-3" />
                    보증서
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Certificate Preview */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">데이터 청정도 보증서</h3>
              <p className="text-sm text-muted-foreground">VeriNode Purity Certificate</p>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-sm text-muted-foreground">자연인 검증</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-500">완료</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-sm text-muted-foreground">AI 생성 검사</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-500">통과</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-sm text-muted-foreground">생체 인증</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-500">확인됨</span>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={() => handleDownloadCertificate()}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  PDF 생성 중...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  청정도 보증서 다운로드
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
