import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Home, ShoppingCart, Heart, MapPin, 
  Car, Briefcase, GraduationCap, Wifi, WifiOff,
  Clock, CheckCircle2, AlertCircle, RefreshCw,
  TrendingUp, TrendingDown, Minus, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RollingNumber from "@/components/animations/RollingNumber";

interface DataCategoryMonitorViewProps {
  onBack: () => void;
}

type UpdateStatus = "realtime" | "recent" | "scheduled" | "warning";
type Volatility = "high" | "medium" | "low" | "stable";

interface DataCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  value: number;
  volatility: Volatility;
  updateStatus: UpdateStatus;
  lastUpdate: string;
  nextCheck: number | null; // null means realtime
  updateLog: string;
  trend: "up" | "down" | "stable";
  trendPercent: number;
}

const dataCategories: DataCategory[] = [
  {
    id: "real-estate",
    name: "부동산",
    icon: Home,
    value: 2850000,
    volatility: "low",
    updateStatus: "scheduled",
    lastUpdate: "2024-06-15",
    nextCheck: 180,
    updateLog: "반기 점검 완료 - 가치 유지",
    trend: "stable",
    trendPercent: 0.2
  },
  {
    id: "consumption",
    name: "소비 패턴",
    icon: ShoppingCart,
    value: 1240000,
    volatility: "high",
    updateStatus: "realtime",
    lastUpdate: "방금 전",
    nextCheck: null,
    updateLog: "실시간 연동 중 - 데이터 신선도 최고",
    trend: "up",
    trendPercent: 12.4
  },
  {
    id: "health",
    name: "건강 지표",
    icon: Heart,
    value: 980000,
    volatility: "medium",
    updateStatus: "recent",
    lastUpdate: "3시간 전",
    nextCheck: 7,
    updateLog: "주간 동기화 예정 - 웨어러블 연동",
    trend: "up",
    trendPercent: 5.8
  },
  {
    id: "mobility",
    name: "동선 데이터",
    icon: MapPin,
    value: 560000,
    volatility: "high",
    updateStatus: "recent",
    lastUpdate: "1시간 전",
    nextCheck: null,
    updateLog: "GPS 기반 실시간 추적 중",
    trend: "up",
    trendPercent: 8.2
  },
  {
    id: "vehicle",
    name: "차량 정보",
    icon: Car,
    value: 420000,
    volatility: "low",
    updateStatus: "scheduled",
    lastUpdate: "2024-05-20",
    nextCheck: 90,
    updateLog: "분기별 검증 - 다음 점검 예정",
    trend: "stable",
    trendPercent: 0.0
  },
  {
    id: "career",
    name: "경력 프로필",
    icon: Briefcase,
    value: 1560000,
    volatility: "low",
    updateStatus: "scheduled",
    lastUpdate: "2024-04-10",
    nextCheck: 120,
    updateLog: "연간 업데이트 권장",
    trend: "stable",
    trendPercent: 1.2
  },
  {
    id: "education",
    name: "학력/자격",
    icon: GraduationCap,
    value: 890000,
    volatility: "stable",
    updateStatus: "scheduled",
    lastUpdate: "2024-01-15",
    nextCheck: 365,
    updateLog: "정적 데이터 - 변동 없음",
    trend: "stable",
    trendPercent: 0.0
  }
];

const getStatusConfig = (status: UpdateStatus) => {
  switch (status) {
    case "realtime":
      return { 
        color: "bg-emerald-500", 
        text: "실시간 갱신 중", 
        icon: Wifi,
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700"
      };
    case "recent":
      return { 
        color: "bg-blue-500", 
        text: "최근 갱신", 
        icon: CheckCircle2,
        bgColor: "bg-blue-50",
        textColor: "text-blue-700"
      };
    case "scheduled":
      return { 
        color: "bg-slate-400", 
        text: "예정된 검사", 
        icon: Clock,
        bgColor: "bg-slate-50",
        textColor: "text-slate-700"
      };
    case "warning":
      return { 
        color: "bg-amber-500", 
        text: "갱신 필요", 
        icon: AlertCircle,
        bgColor: "bg-amber-50",
        textColor: "text-amber-700"
      };
  }
};

const getVolatilityConfig = (volatility: Volatility) => {
  switch (volatility) {
    case "high":
      return { label: "고변동", color: "text-rose-600", bg: "bg-rose-50" };
    case "medium":
      return { label: "중변동", color: "text-amber-600", bg: "bg-amber-50" };
    case "low":
      return { label: "저변동", color: "text-blue-600", bg: "bg-blue-50" };
    case "stable":
      return { label: "정적", color: "text-slate-600", bg: "bg-slate-100" };
  }
};

export const DataCategoryMonitorView = ({ onBack }: DataCategoryMonitorViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const totalValue = dataCategories.reduce((sum, cat) => sum + cat.value, 0);
  const realtimeCount = dataCategories.filter(c => c.updateStatus === "realtime").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">데이터 카테고리 관제</h1>
                <p className="text-sm text-slate-500">Category-based Value Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-slate-600">{realtimeCount}개 실시간 연동</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 mb-1">총 데이터 자산 가치</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">₩</span>
                <RollingNumber value={totalValue} className="text-2xl font-bold text-slate-900" />
              </div>
              <p className="text-xs text-slate-400 mt-1">{dataCategories.length}개 카테고리 합산</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 mb-1">평균 데이터 신선도</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">94.2%</span>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs">
                  우수
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">실시간 갱신 데이터 포함</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 mb-1">다음 검증 예정</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">D-7</span>
                <span className="text-sm text-slate-500">건강 지표</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">주간 동기화 예정</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Grid */}
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-4">카테고리별 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataCategories.map((category, idx) => {
              const statusConfig = getStatusConfig(category.updateStatus);
              const volatilityConfig = getVolatilityConfig(category.volatility);
              const StatusIcon = statusConfig.icon;
              const CategoryIcon = category.icon;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className={`bg-white border-slate-200 hover:border-slate-300 transition-all cursor-pointer ${
                      selectedCategory === category.id ? 'ring-2 ring-slate-900' : ''
                    }`}
                    onClick={() => setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )}
                  >
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <CategoryIcon className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900">{category.name}</h3>
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${volatilityConfig.bg} ${volatilityConfig.color}`}>
                              <Activity className="w-3 h-3" />
                              {volatilityConfig.label}
                            </div>
                          </div>
                        </div>
                        {/* Status Indicator */}
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${statusConfig.color} ${
                            category.updateStatus === 'realtime' ? 'animate-pulse' : ''
                          }`} />
                        </div>
                      </div>

                      {/* Value */}
                      <div className="mb-4">
                        <p className="text-xs text-slate-400 mb-1">현재 가치</p>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-bold text-slate-900">
                            ₩{category.value.toLocaleString()}
                          </span>
                          <div className={`flex items-center gap-1 text-sm ${
                            category.trend === 'up' ? 'text-emerald-600' :
                            category.trend === 'down' ? 'text-rose-600' : 'text-slate-500'
                          }`}>
                            {category.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                            {category.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                            {category.trend === 'stable' && <Minus className="w-4 h-4" />}
                            <span>{category.trend === 'stable' ? '±' : category.trend === 'up' ? '+' : '-'}{category.trendPercent}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Update Status */}
                      <div className={`p-3 rounded-lg ${statusConfig.bgColor} mb-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon className={`w-4 h-4 ${statusConfig.textColor}`} />
                          <span className={`text-sm font-medium ${statusConfig.textColor}`}>
                            {statusConfig.text}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{category.updateLog}</p>
                      </div>

                      {/* Validity Countdown */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">다음 유효성 검사</span>
                        {category.nextCheck === null ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            실시간 갱신 중
                          </span>
                        ) : (
                          <span className="font-medium text-slate-900">D-{category.nextCheck}일</span>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {selectedCategory === category.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-slate-100"
                        >
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">마지막 갱신</span>
                              <span className="text-slate-900">{category.lastUpdate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">데이터 품질</span>
                              <span className="text-emerald-600 font-medium">98.5%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">V-Core 인증</span>
                              <Badge variant="outline" className="text-xs bg-slate-900 text-white border-0">
                                적용됨
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" className="w-full mt-3 bg-slate-900 hover:bg-slate-800">
                            수동 갱신 요청
                          </Button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Update Log Timeline */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-slate-900">
              지능형 업데이트 로그
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: "14:32", category: "소비 패턴", action: "실시간 트랜잭션 감지 - 카드 결제 데이터 반영", status: "realtime" },
                { time: "13:15", category: "동선 데이터", action: "GPS 좌표 업데이트 완료", status: "recent" },
                { time: "10:00", category: "건강 지표", action: "웨어러블 동기화 - 수면 데이터 수신", status: "recent" },
                { time: "어제", category: "부동산", action: "반기 점검 완료 - 시세 변동 없음", status: "scheduled" },
                { time: "3일 전", category: "차량 정보", action: "주행거리 업데이트", status: "scheduled" },
              ].map((log, idx) => {
                const config = getStatusConfig(log.status as UpdateStatus);
                return (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-400">{log.time}</span>
                        <Badge variant="outline" className="text-xs bg-white">{log.category}</Badge>
                      </div>
                      <p className="text-sm text-slate-700">{log.action}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataCategoryMonitorView;
