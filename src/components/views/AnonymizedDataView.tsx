import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Lock, CheckCircle2, Eye, EyeOff, Download, FileCheck } from "lucide-react";

interface AnonymizedDataViewProps {
  onBack: () => void;
}

interface DataRow {
  id: number;
  company: string;
  amount: string;
  category: string;
  date: string;
}

const originalData: DataRow[] = [
  { id: 1, company: "삼성전자", amount: "₩2,450,000,000", category: "IT/전자", date: "2024-01-15" },
  { id: 2, company: "현대자동차", amount: "₩1,890,000,000", category: "자동차", date: "2024-01-18" },
  { id: 3, company: "SK하이닉스", amount: "₩3,120,000,000", category: "반도체", date: "2024-01-20" },
  { id: 4, company: "LG화학", amount: "₩980,000,000", category: "화학", date: "2024-01-22" },
  { id: 5, company: "네이버", amount: "₩1,560,000,000", category: "IT/플랫폼", date: "2024-01-25" },
];

const anonymizedData = [
  { id: 1, company: "대기업 A", amount: "₩20억~30억", category: "IT/전자", date: "2024-Q1" },
  { id: 2, company: "대기업 B", amount: "₩15억~20억", category: "자동차", date: "2024-Q1" },
  { id: 3, company: "대기업 C", amount: "₩30억~35억", category: "반도체", date: "2024-Q1" },
  { id: 4, company: "중견기업 D", amount: "₩8억~12억", category: "화학", date: "2024-Q1" },
  { id: 5, company: "대기업 E", amount: "₩15억~18억", category: "IT/플랫폼", date: "2024-Q1" },
];

const AnonymizedDataView = ({ onBack }: AnonymizedDataViewProps) => {
  const [mosaicProgress, setMosaicProgress] = useState(0);
  const [showMosaic, setShowMosaic] = useState<number[]>([]);
  const [processingComplete, setProcessingComplete] = useState(false);

  useEffect(() => {
    // 순차적으로 모자이크 애니메이션 적용
    const intervals: ReturnType<typeof setTimeout>[] = [];
    
    originalData.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setShowMosaic(prev => [...prev, index]);
        setMosaicProgress(((index + 1) / originalData.length) * 100);
      }, (index + 1) * 800);
      intervals.push(timeout);
    });

    const completeTimeout = setTimeout(() => {
      setProcessingComplete(true);
    }, originalData.length * 800 + 500);

    return () => {
      intervals.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, []);

  const renderMosaicText = (text: string, rowIndex: number, isSensitive: boolean) => {
    const isMosaicked = showMosaic.includes(rowIndex);
    
    if (!isSensitive) return <span>{text}</span>;
    
    return (
      <span className="relative inline-block min-w-16">
        <span 
          className={`transition-all duration-500 ${isMosaicked ? 'blur-md opacity-40 select-none' : ''}`}
        >
          {text}
        </span>
        {isMosaicked && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="bg-navy/90 text-primary-foreground px-2 py-0.5 rounded text-[10px] font-medium animate-pulse whitespace-nowrap">
              🔒 암호화
            </span>
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-navy/5 to-background pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy to-trust text-primary-foreground p-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">기업 데이터 익명화 결과</h1>
            <p className="text-sm opacity-80">AI 기반 실시간 데이터 정제 시스템</p>
          </div>
        </div>

        {/* 진행 상태 */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">익명화 처리 진행률</span>
            <span className="text-sm font-bold">{Math.round(mosaicProgress)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{ width: `${mosaicProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 보안 확약 문구 */}
        {processingComplete && (
          <Card className="bg-gradient-to-r from-success/10 to-trust/10 border-success/30 animate-fade-in overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-8 w-8 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-success mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    보안 검증 완료
                  </h3>
                  <p className="text-foreground font-medium text-base leading-relaxed">
                    귀사의 핵심 기밀은 <span className="text-success font-bold text-xl">0건</span> 유출되었으며,
                  </p>
                  <p className="text-foreground font-medium text-base leading-relaxed">
                    통계적 가치만 <span className="text-trust font-bold">성공적으로 추출</span>되었습니다.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Badge variant="outline" className="border-success text-success bg-success/5">
                      <Lock className="h-3 w-3 mr-1" />
                      AES-256 암호화
                    </Badge>
                    <Badge variant="outline" className="border-trust text-trust bg-trust/5">
                      <Shield className="h-3 w-3 mr-1" />
                      GDPR 준수
                    </Badge>
                    <Badge variant="outline" className="border-accent text-accent bg-accent/5">
                      <FileCheck className="h-3 w-3 mr-1" />
                      ISO 27001
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 데이터 비교 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 원본 데이터 */}
          <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-background">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-5 w-5 text-warning" />
                원본 데이터
                <Badge variant="outline" className="border-warning text-warning text-xs ml-auto">
                  민감정보 포함
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">회사명</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">금액</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">분류</th>
                    </tr>
                  </thead>
                  <tbody>
                    {originalData.map((row, index) => (
                      <tr 
                        key={row.id} 
                        className={`border-b border-border/50 transition-all duration-300 ${
                          showMosaic.includes(index) ? 'bg-warning/5' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {renderMosaicText(row.company, index, true)}
                        </td>
                        <td className="px-4 py-3">
                          {renderMosaicText(row.amount, index, true)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 익명화된 데이터 */}
          <Card className="border-success/30 bg-gradient-to-br from-success/5 to-background">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-success" />
                익명화된 통계 데이터
                <Badge variant="outline" className="border-success text-success text-xs ml-auto">
                  안전
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">식별자</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">금액 범위</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">분류</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anonymizedData.map((row, index) => (
                      <tr 
                        key={row.id} 
                        className={`border-b border-border/50 transition-all duration-500 ${
                          processingComplete ? 'opacity-100' : 'opacity-30'
                        }`}
                        style={{ transitionDelay: `${index * 100}ms` }}
                      >
                        <td className="px-4 py-3 font-medium text-success">
                          {row.company}
                        </td>
                        <td className="px-4 py-3 text-trust font-medium">
                          {row.amount}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 처리 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-trust">5건</div>
              <div className="text-xs text-muted-foreground">처리된 레코드</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">10개</div>
              <div className="text-xs text-muted-foreground">익명화된 필드</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">0건</div>
              <div className="text-xs text-muted-foreground">기밀 유출</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">98%</div>
              <div className="text-xs text-muted-foreground">통계적 유용성</div>
            </CardContent>
          </Card>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            돌아가기
          </Button>
          <Button variant="trust" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnonymizedDataView;
