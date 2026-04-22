import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, ShoppingCart, Home, Heart, MapPin, 
  GraduationCap, Briefcase, TrendingUp, AlertCircle,
  Award, Star, ChevronRight, Plus, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, ResponsiveContainer 
} from "recharts";

interface DataPortfolioViewProps {
  onBack: () => void;
}

interface DataCategory {
  id: string;
  name: string;
  fullName: string;
  icon: React.ElementType;
  value: number; // 0-100
  marketScarcity: number; // 1.0 - 3.0
  basePrice: number;
}

const dataCategories: DataCategory[] = [
  { id: "consumption", name: "소비", fullName: "소비 패턴", icon: ShoppingCart, value: 85, marketScarcity: 1.2, basePrice: 1200 },
  { id: "asset", name: "자산", fullName: "금융 자산", icon: Briefcase, value: 45, marketScarcity: 1.5, basePrice: 2800 },
  { id: "health", name: "건강", fullName: "건강 지표", icon: Heart, value: 72, marketScarcity: 1.8, basePrice: 1800 },
  { id: "mobility", name: "동선", fullName: "이동 동선", icon: MapPin, value: 90, marketScarcity: 1.3, basePrice: 980 },
  { id: "residence", name: "주거", fullName: "주거 정보", icon: Home, value: 20, marketScarcity: 2.4, basePrice: 3200 },
  { id: "education", name: "학력", fullName: "학력/자격", icon: GraduationCap, value: 60, marketScarcity: 1.1, basePrice: 850 },
];

const synergyBonuses = [
  { 
    condition: "부동산 데이터 추가", 
    effect: "소비 데이터 단가 3배 상승",
    targetCategory: "residence",
    requiredValue: 50
  },
  { 
    condition: "건강 + 동선 데이터 결합", 
    effect: "라이프스타일 프리미엄 +45%",
    targetCategory: "health",
    requiredValue: 70
  },
  { 
    condition: "학력 + 자산 데이터 결합", 
    effect: "경제력 지표 단가 2.5배",
    targetCategory: "education",
    requiredValue: 60
  },
];

const getGrade = (categories: DataCategory[]): { grade: string; label: string; color: string } => {
  const avgValue = categories.reduce((sum, c) => sum + c.value, 0) / categories.length;
  const minValue = Math.min(...categories.map(c => c.value));
  
  if (minValue >= 70 && avgValue >= 80) {
    return { grade: "Master", label: "마스터", color: "text-amber-500" };
  } else if (minValue >= 50 && avgValue >= 65) {
    return { grade: "Expert", label: "전문가", color: "text-blue-500" };
  } else if (avgValue >= 50) {
    return { grade: "Advanced", label: "숙련자", color: "text-emerald-500" };
  } else if (avgValue >= 30) {
    return { grade: "Intermediate", label: "중급자", color: "text-slate-500" };
  } else {
    return { grade: "Beginner", label: "입문자", color: "text-slate-400" };
  }
};

export const DataPortfolioView = ({ onBack }: DataPortfolioViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const gradeInfo = getGrade(dataCategories);
  const avgValue = Math.round(dataCategories.reduce((sum, c) => sum + c.value, 0) / dataCategories.length);
  const totalValue = dataCategories.reduce((sum, c) => sum + (c.basePrice * c.value / 100 * c.marketScarcity), 0);
  
  // Radar chart data
  const radarData = dataCategories.map(cat => ({
    category: cat.name,
    value: cat.value,
    fullMark: 100,
  }));

  // Find scarcest category
  const scarcestCategory = dataCategories.reduce((max, cat) => 
    cat.marketScarcity > max.marketScarcity ? cat : max
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">데이터 포트폴리오</h1>
                <p className="text-sm text-slate-500">Data Asset Portfolio</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              gradeInfo.grade === 'Master' ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200'
            }`}>
              <Award className={`h-4 w-4 ${gradeInfo.color}`} />
              <span className={`text-sm font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Radar Chart Section */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-slate-900 flex items-center justify-between">
              <span>카테고리별 데이터 보유량</span>
              <span className="text-sm font-normal text-slate-500">평균 {avgValue}%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis 
                    dataKey="category" 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickCount={5}
                  />
                  <Radar
                    name="보유량"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Grade Info */}
            {gradeInfo.grade !== 'Master' && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700">
                      모든 카테고리를 70% 이상 채우면 <span className="font-bold text-amber-600">Master</span> 등급 달성
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Master 등급 시 전 카테고리 프리미엄 단가(+50%) 적용
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {gradeInfo.grade === 'Master' && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Master 등급 달성!</p>
                    <p className="text-xs text-amber-600">전 카테고리 프리미엄 단가 +50% 적용 중</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scarcity Alert */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">실시간 희소성 알림</p>
                <p className="text-sm text-slate-600 mt-1">
                  현재 시장에 <span className="font-medium text-blue-600">{scarcestCategory.fullName}</span> 데이터가 부족하여 
                  보상 가중치가 <span className="font-bold text-blue-600">{scarcestCategory.marketScarcity.toFixed(1)}배</span> 적용 중입니다.
                </p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                x{scarcestCategory.marketScarcity.toFixed(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Category Detail List */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-slate-900">카테고리별 상세</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataCategories.map((category) => {
              const Icon = category.icon;
              const effectivePrice = Math.round(category.basePrice * category.value / 100 * category.marketScarcity);
              
              return (
                <div 
                  key={category.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedCategory === category.id 
                      ? 'bg-slate-50 border-slate-300' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">{category.fullName}</span>
                        <div className="flex items-center gap-2">
                          {category.marketScarcity >= 2.0 && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              희소
                            </Badge>
                          )}
                          <span className="text-sm font-bold text-slate-900">{category.value}%</span>
                        </div>
                      </div>
                      <Progress value={category.value} className="h-2" />
                      
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-slate-500">
                          기본 단가: ₩{category.basePrice.toLocaleString()}
                        </span>
                        <span className="text-slate-500">
                          시장 가중치: x{category.marketScarcity.toFixed(1)}
                        </span>
                        <span className="font-medium text-slate-700">
                          현재 가치: ₩{effectivePrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${
                      selectedCategory === category.id ? 'rotate-90' : ''
                    }`} />
                  </div>
                  
                  {/* Expanded Detail */}
                  {selectedCategory === category.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-100"
                    >
                      {category.value < 50 ? (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <Plus className="h-4 w-4 text-blue-600" />
                          <p className="text-sm text-blue-700">
                            데이터를 추가하면 포트폴리오 균형이 개선됩니다
                          </p>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-600 space-y-1">
                          <div className="flex justify-between">
                            <span>데이터 품질 점수</span>
                            <span className="font-medium text-slate-900">94.2%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>마지막 갱신</span>
                            <span className="font-medium text-slate-900">2시간 전</span>
                          </div>
                          <div className="flex justify-between">
                            <span>V-Core 인증</span>
                            <Badge variant="outline" className="text-xs">적용됨</Badge>
                          </div>
                        </div>
                      )}
                      <Button size="sm" className="w-full mt-3 bg-slate-900 hover:bg-slate-800">
                        {category.value < 50 ? '데이터 추가하기' : '상세 보기'}
                      </Button>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Synergy Bonuses */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              결합 가치 보너스
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {synergyBonuses.map((bonus, idx) => {
              const targetCat = dataCategories.find(c => c.id === bonus.targetCategory);
              const isAchievable = targetCat && targetCat.value < bonus.requiredValue;
              
              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    isAchievable 
                      ? 'bg-amber-50 border-amber-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-sm font-medium ${isAchievable ? 'text-amber-900' : 'text-slate-500'}`}>
                        {bonus.condition}
                      </p>
                      <p className={`text-sm mt-1 ${isAchievable ? 'text-amber-700' : 'text-slate-400'}`}>
                        → {bonus.effect}
                      </p>
                    </div>
                    {isAchievable ? (
                      <Badge className="bg-amber-500 text-white shrink-0">달성 가능</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-slate-300 shrink-0">달성</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Total Portfolio Value */}
        <Card className="bg-slate-900 border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">총 포트폴리오 가치</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ₩{Math.round(totalValue).toLocaleString()}
                  <span className="text-sm font-normal text-slate-400 ml-2">/ 월</span>
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+12.4%</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">전월 대비</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataPortfolioView;
