import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, TrendingUp, Users, Building2, Shield, 
  CheckCircle2, AlertTriangle, RefreshCw, Database,
  FileCheck, Award, Zap, ArrowUpRight, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RollingNumber from "@/components/animations/RollingNumber";

interface WinWinDashboardProps {
  onBack: () => void;
}

// 실시간 거래 매칭 데이터
const matchingEvents = [
  "헬스케어 산업군 수요 발생 - 데이터 공급자 214명 매칭 및 정산 완료",
  "금융 분석 요청 - 인증된 공급자 89명 데이터 전송 중",
  "리테일 마케팅 수요 - 327명 공급자 매칭, 평균 단가 ₩2,340",
  "제조업 품질 데이터 - 156명 V-Core 인증 공급자 매칭 완료",
  "모빌리티 산업 수요 - 실시간 매칭률 98.7% 달성",
  "에너지 분야 요청 - 고신뢰 등급 공급자 45명 우선 배정"
];

// 실시간 무결성 로그
const integrityLogs = [
  { time: "14:32:01", pValue: 0.023, ci: "±2.1%", status: "pass" },
  { time: "14:32:05", pValue: 0.018, ci: "±1.8%", status: "pass" },
  { time: "14:32:09", pValue: 0.041, ci: "±3.2%", status: "pass" },
  { time: "14:32:14", pValue: 0.012, ci: "±1.4%", status: "pass" },
  { time: "14:32:18", pValue: 0.067, ci: "±4.1%", status: "warning" },
  { time: "14:32:22", pValue: 0.009, ci: "±0.9%", status: "pass" },
];

// 공급자 정산 데이터
const providerSettlements = [
  { category: "소비 패턴 데이터", grade: "A+", basePrice: 1200, vCoreBonus: 240, total: 1440, count: 23 },
  { category: "위치 기반 행동", grade: "A", basePrice: 980, vCoreBonus: 196, total: 1176, count: 45 },
  { category: "관심사 프로필", grade: "B+", basePrice: 650, vCoreBonus: 130, total: 780, count: 12 },
  { category: "건강 지표", grade: "A+", basePrice: 2100, vCoreBonus: 420, total: 2520, count: 8 },
];

// 마켓플레이스 상품
const marketplaceProducts = [
  { 
    name: "금융 소비자 행동 데이터셋", 
    samples: 12500, 
    purity: 99.2, 
    errorMargin: "±1.2%",
    price: "₩4,500,000"
  },
  { 
    name: "헬스케어 웰니스 패턴", 
    samples: 8900, 
    purity: 98.7, 
    errorMargin: "±1.8%",
    price: "₩3,200,000"
  },
  { 
    name: "리테일 구매 의사결정 분석", 
    samples: 21000, 
    purity: 97.9, 
    errorMargin: "±2.3%",
    price: "₩6,800,000"
  },
];

export const WinWinDashboard = ({ onBack }: WinWinDashboardProps) => {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("enterprise");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMatchIndex((prev) => (prev + 1) % matchingEvents.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Win-Win Impact Dashboard</h1>
                <p className="text-sm text-slate-500">수요자-공급자 상호 가치 창출 현황</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                실시간 연동 중
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Win-Win KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">전체 공급자 누적 보상액</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900">₩</span>
                    <RollingNumber value={2847650000} className="text-3xl font-bold text-slate-900" />
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-emerald-600 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>이번 달 +12.3%</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">참여 공급자</span>
                  <span className="font-medium text-slate-700">24,891명</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500">평균 인당 수익</span>
                  <span className="font-medium text-slate-700">₩114,420</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">수요자 가짜 데이터 비용 절감액</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900">₩</span>
                    <RollingNumber value={8924300000} className="text-3xl font-bold text-slate-900" />
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-emerald-600 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>업계 평균 대비 34% 절감</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <Building2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">구독 기업</span>
                  <span className="font-medium text-slate-700">156개사</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500">불량 데이터 차단률</span>
                  <span className="font-medium text-slate-700">99.7%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Matching Ticker */}
        <Card className="bg-slate-900 border-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded text-emerald-400 text-xs font-medium shrink-0">
                <Zap className="h-3 w-3" />
                LIVE MATCHING
              </div>
              <div className="overflow-hidden flex-1">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentMatchIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-slate-300 text-sm font-mono"
                  >
                    {matchingEvents[currentMatchIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="enterprise" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Building2 className="h-4 w-4 mr-2" />
              수요자 (기업)
            </TabsTrigger>
            <TabsTrigger value="provider" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              공급자 (개인)
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Database className="h-4 w-4 mr-2" />
              마켓플레이스
            </TabsTrigger>
          </TabsList>

          {/* Enterprise View */}
          <TabsContent value="enterprise" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Subscription Status */}
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-slate-900">구독 현황</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-blue-600 font-medium">현재 플랜</span>
                      <Badge className="bg-blue-600">Professional</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">잔여 기간</span>
                      <span className="text-sm font-medium text-slate-900">127일</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">월간 데이터 수신량</span>
                      <span className="text-sm font-medium text-slate-900">2.4TB / 5TB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">API 호출 수</span>
                      <span className="text-sm font-medium text-slate-900">847,291회</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">활성 파이프라인</span>
                      <span className="text-sm font-medium text-slate-900">12개</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Integrity Logs */}
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium text-slate-900">실시간 무결성 로그</CardTitle>
                    <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 font-mono text-xs">
                    {integrityLogs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2 rounded border ${
                          log.status === 'pass' 
                            ? 'bg-slate-50 border-slate-100' 
                            : 'bg-amber-50 border-amber-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">{log.time}</span>
                          <span className={log.status === 'pass' ? 'text-emerald-600' : 'text-amber-600'}>
                            {log.status === 'pass' ? '✓ PASS' : '⚠ CHECK'}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-1">
                          <span className="text-slate-600">p-value: <span className="text-slate-900">{log.pValue}</span></span>
                          <span className="text-slate-600">95% CI: <span className="text-slate-900">{log.ci}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Security & Compliance */}
              <Card className="bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-slate-900">보안/규제 현황</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-slate-700">ISO 27001 준수</span>
                    </div>
                    <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200">정상</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-slate-700">GDPR 위반</span>
                    </div>
                    <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200">0건</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-slate-700">데이터 암호화</span>
                    </div>
                    <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200">AES-256</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-slate-700">마지막 감사</span>
                    </div>
                    <Badge variant="outline" className="bg-white text-slate-700 border-slate-200">3일 전</Badge>
                  </div>

                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-amber-800 font-medium">데이터 오차 5% 초과 발생 중</p>
                        <p className="text-xs text-amber-600 mt-1">Enterprise 전용 노드 업그레이드 권장</p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full mt-3 bg-slate-900 hover:bg-slate-800">
                      업그레이드 검토
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Provider View */}
          <TabsContent value="provider" className="space-y-4">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-slate-900">정산 리스트</CardTitle>
                  <Badge variant="outline" className="text-slate-600">이번 달 정산</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 px-4 font-medium text-slate-500">데이터 카테고리</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-500">시장 등급</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">기본 단가</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">V-Core 보너스</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">총 단가</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">거래 수</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">소계</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providerSettlements.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-900">{item.category}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge 
                              variant="outline" 
                              className={`${
                                item.grade.startsWith('A') 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {item.grade}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">₩{item.basePrice.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-emerald-600">+₩{item.vCoreBonus.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">₩{item.total.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{item.count}건</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">
                            ₩{(item.total * item.count).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50">
                        <td colSpan={6} className="py-3 px-4 text-right font-medium text-slate-700">
                          이번 달 총 정산액
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ₩{providerSettlements.reduce((sum, item) => sum + (item.total * item.count), 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">가치 상승 근거</p>
                      <ul className="mt-2 space-y-1 text-sm text-blue-700">
                        <li>• V-Core 인증 적용: 단가 <span className="font-medium">20% 상승</span></li>
                        <li>• 3개월 연속 무결성 유지: 추가 보너스 <span className="font-medium">5%</span></li>
                        <li>• 희소 카테고리(건강 지표): 시장 프리미엄 <span className="font-medium">15%</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace View */}
          <TabsContent value="marketplace" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {marketplaceProducts.map((product, idx) => (
                <Card key={idx} className="bg-white border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-medium text-slate-900">{product.name}</h3>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        V-Core 인증
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">샘플 수</span>
                        <span className="font-medium text-slate-900">{product.samples.toLocaleString()}건</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Purity Index</span>
                        <span className="font-medium text-emerald-600">{product.purity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">통계적 오차 범위</span>
                        <span className="font-medium text-slate-900">{product.errorMargin}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-slate-600" />
                          <span className="text-xs font-medium text-slate-700">Garbage-Free Guarantee</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          V-Core 검증 완료. 가짜/오염 데이터 0% 보증
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-900">{product.price}</span>
                        <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                          구매하기
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
