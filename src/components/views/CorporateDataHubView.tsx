import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building2, TrendingUp, Calendar, Target, 
  Sparkles, Clock, BarChart3, Bell, CheckCircle2,
  ChevronRight, Star, Zap, RefreshCw, Filter,
  ShoppingCart, Package, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCorporatePreferences, SeasonalTemplate, RecommendedProduct } from '@/hooks/useCorporatePreferences';
import { CorporatePreferencesSheet } from '@/components/corporate/CorporatePreferencesSheet';
import { SubscriptionCreateSheet } from '@/components/corporate/SubscriptionCreateSheet';
import { DataRequestSheet } from '@/components/corporate/DataRequestSheet';

interface CorporateDataHubViewProps {
  onBack: () => void;
}

const INDUSTRY_ICONS: Record<string, React.ReactNode> = {
  '제조업': <Building2 className="h-4 w-4" />,
  '금융': <TrendingUp className="h-4 w-4" />,
  '유통': <ShoppingCart className="h-4 w-4" />,
  'IT': <Zap className="h-4 w-4" />,
  '헬스케어': <Target className="h-4 w-4" />,
};

const URGENCY_COLORS: Record<string, string> = {
  normal: 'bg-muted text-muted-foreground',
  fast: 'bg-amber-500/20 text-amber-600',
  urgent: 'bg-destructive/20 text-destructive',
};

const URGENCY_LABELS: Record<string, string> = {
  normal: '일반',
  fast: '빠른',
  urgent: '긴급',
};

export const CorporateDataHubView: React.FC<CorporateDataHubViewProps> = ({ onBack }) => {
  const { 
    preferences, 
    templates, 
    recommendations, 
    subscriptions,
    relevantTemplates,
    isLoading 
  } = useCorporatePreferences();
  
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showDataRequest, setShowDataRequest] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SeasonalTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('recommendations');

  const currentMonth = new Date().getMonth() + 1;
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  const handleTemplateSelect = (template: SeasonalTemplate) => {
    setSelectedTemplate(template);
    setShowDataRequest(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">데이터 허브를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">기업 데이터 허브</h1>
                <p className="text-xs text-muted-foreground">맞춤 추천 & 구독 관리</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPreferences(true)}>
              <Settings className="h-4 w-4 mr-1" />
              설정
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 선호도 미설정 시 안내 */}
        {!preferences && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">맞춤 추천을 받아보세요</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      업종과 선호 분야를 설정하면 AI가 시즌별 최적의 데이터를 추천해드립니다
                    </p>
                  </div>
                  <Button onClick={() => setShowPreferences(true)}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    선호도 설정하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 현재 시즌 배너 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">현재 시즌</p>
                    <p className="font-bold text-lg">{monthNames[currentMonth - 1]} 추천 데이터</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {relevantTemplates.length}개 추천
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              추천
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              구독
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs">
              <Package className="h-3 w-3 mr-1" />
              템플릿
            </TabsTrigger>
          </TabsList>

          {/* 추천 탭 */}
          <TabsContent value="recommendations" className="mt-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {relevantTemplates.length > 0 ? (
                relevantTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={URGENCY_COLORS[template.urgency_level]}>
                                {URGENCY_LABELS[template.urgency_level]}
                              </Badge>
                              {template.applicable_industries.slice(0, 2).map(ind => (
                                <Badge key={ind} variant="outline" className="text-xs">
                                  {INDUSTRY_ICONS[ind]}
                                  <span className="ml-1">{ind}</span>
                                </Badge>
                              ))}
                            </div>
                            <h3 className="font-semibold">{template.template_name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                {template.typical_sample_size.toLocaleString()}명 권장
                              </span>
                              <span className="flex items-center gap-1">
                                <Filter className="h-3 w-3" />
                                {template.recommended_categories.length}개 카테고리
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      이번 달에는 맞춤 추천이 없습니다
                    </p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => setActiveTab('templates')}
                    >
                      전체 템플릿 보기
                    </Button>
                  </CardContent>
                </Card>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* 구독 탭 */}
          <TabsContent value="subscriptions" className="mt-4 space-y-4">
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((sub, index) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {sub.subscription_type === 'monthly' ? '월간' : 
                               sub.subscription_type === 'quarterly' ? '분기별' : '연간'} 구독
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {sub.categories.join(', ')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                          {sub.is_active ? '활성' : '비활성'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">샘플 수</p>
                          <p className="font-semibold">{sub.target_sample_count}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">등급</p>
                          <p className="font-semibold capitalize">{sub.target_grade}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">예산</p>
                          <p className="font-semibold">{(sub.monthly_budget / 10000).toFixed(0)}만</p>
                        </div>
                      </div>
                      {sub.next_collection_date && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          다음 수집: {new Date(sub.next_collection_date).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    정기 구독이 없습니다
                  </p>
                  <Button onClick={() => setShowSubscription(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    구독 시작하기
                  </Button>
                </CardContent>
              </Card>
            )}

            {subscriptions && subscriptions.length > 0 && (
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setShowSubscription(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                새 구독 추가
              </Button>
            )}
          </TabsContent>

          {/* 템플릿 탭 */}
          <TabsContent value="templates" className="mt-4 space-y-4">
            {templates?.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={URGENCY_COLORS[template.urgency_level]}>
                            {URGENCY_LABELS[template.urgency_level]}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {template.applicable_months.map(m => `${m}월`).join(', ')}
                          </div>
                        </div>
                        <h3 className="font-semibold">{template.template_name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {template.recommended_categories.map(cat => (
                            <Badge key={cat} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>

        {/* 단건 요청 CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">맞춤 데이터 요청</h3>
                  <p className="text-sm text-muted-foreground">
                    원하는 조건으로 직접 데이터 수집을 요청하세요
                  </p>
                </div>
                <Button onClick={() => setShowDataRequest(true)}>
                  <Zap className="h-4 w-4 mr-2" />
                  요청하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sheets */}
      <CorporatePreferencesSheet 
        open={showPreferences} 
        onOpenChange={setShowPreferences}
        existingPreferences={preferences}
      />
      
      <SubscriptionCreateSheet
        open={showSubscription}
        onOpenChange={setShowSubscription}
        preferenceId={preferences?.id}
      />
      
      <DataRequestSheet
        open={showDataRequest}
        onOpenChange={setShowDataRequest}
        template={selectedTemplate}
        onClearTemplate={() => setSelectedTemplate(null)}
      />
    </div>
  );
};
