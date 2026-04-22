-- 기업 선호도 및 구독 설정 테이블
CREATE TABLE public.corporate_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL, -- 제조업, 금융, 유통, IT, 헬스케어 등
  preferred_categories TEXT[] NOT NULL DEFAULT '{}', -- 선호 데이터 카테고리
  preferred_demographics JSONB DEFAULT '{}', -- 선호 인구통계 (연령, 성별, 지역 등)
  collection_frequency TEXT DEFAULT 'quarterly', -- monthly, quarterly, yearly
  budget_range_min INTEGER DEFAULT 0,
  budget_range_max INTEGER DEFAULT 10000000,
  auto_notify BOOLEAN DEFAULT true, -- 시즌별 자동 알림 여부
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 시즌별 데이터 수요 템플릿 (시스템 제공)
CREATE TABLE public.seasonal_data_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  applicable_industries TEXT[] DEFAULT '{}', -- 적용 가능 업종
  applicable_months INTEGER[] DEFAULT '{}', -- 적용 월 (1-12)
  recommended_categories TEXT[] DEFAULT '{}',
  typical_sample_size INTEGER DEFAULT 1000,
  urgency_level TEXT DEFAULT 'normal',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 기업 데이터 구독 플랜
CREATE TABLE public.data_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  preference_id UUID REFERENCES public.corporate_preferences(id),
  subscription_type TEXT NOT NULL, -- monthly, quarterly, yearly
  categories TEXT[] NOT NULL DEFAULT '{}',
  target_sample_count INTEGER DEFAULT 500,
  target_grade TEXT DEFAULT 'silver',
  monthly_budget INTEGER DEFAULT 0,
  next_collection_date DATE,
  last_collection_date DATE,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI 추천 상품 (기업별 맞춤 추천)
CREATE TABLE public.recommended_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  template_id UUID REFERENCES public.seasonal_data_templates(id),
  recommendation_type TEXT NOT NULL, -- 'seasonal', 'history_based', 'industry_trend'
  title TEXT NOT NULL,
  description TEXT,
  categories TEXT[] DEFAULT '{}',
  estimated_price INTEGER DEFAULT 0,
  estimated_sample_count INTEGER DEFAULT 0,
  relevance_score NUMERIC(3,2) DEFAULT 0.00, -- 0.00 ~ 1.00
  expires_at TIMESTAMP WITH TIME ZONE,
  is_viewed BOOLEAN DEFAULT false,
  is_purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.corporate_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_data_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommended_products ENABLE ROW LEVEL SECURITY;

-- corporate_preferences 정책
CREATE POLICY "Buyers can manage own preferences"
ON public.corporate_preferences FOR ALL
USING (auth.uid() = buyer_id)
WITH CHECK (auth.uid() = buyer_id);

-- seasonal_data_templates 정책 (모든 인증 사용자가 조회 가능)
CREATE POLICY "Anyone can view active templates"
ON public.seasonal_data_templates FOR SELECT
USING (is_active = true);

-- data_subscriptions 정책
CREATE POLICY "Buyers can manage own subscriptions"
ON public.data_subscriptions FOR ALL
USING (auth.uid() = buyer_id)
WITH CHECK (auth.uid() = buyer_id);

-- recommended_products 정책
CREATE POLICY "Buyers can view own recommendations"
ON public.recommended_products FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own recommendations"
ON public.recommended_products FOR UPDATE
USING (auth.uid() = buyer_id);

-- 시즌별 템플릿 초기 데이터 삽입
INSERT INTO public.seasonal_data_templates (template_name, description, applicable_industries, applicable_months, recommended_categories, typical_sample_size, urgency_level) VALUES
('분기 실적 보고서용 소비자 분석', '분기별 경영 보고서 작성을 위한 소비 트렌드 및 고객 인사이트', ARRAY['제조업', '유통', '금융'], ARRAY[3, 6, 9, 12], ARRAY['consumption', 'demographics', 'preferences'], 1000, 'normal'),
('연말 결산 종합 리포트', '연간 사업 성과 분석 및 차년도 계획 수립용 종합 데이터', ARRAY['제조업', '금융', 'IT', '유통', '헬스케어'], ARRAY[11, 12], ARRAY['consumption', 'financial', 'demographics'], 2000, 'fast'),
('신제품 출시 전 시장조사', '신제품 런칭 전 타겟 고객 분석 및 수요 예측', ARRAY['제조업', 'IT', '헬스케어'], ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], ARRAY['demographics', 'preferences', 'consumption'], 800, 'urgent'),
('상반기 트렌드 분석', '상반기 시장 트렌드 및 소비자 행동 변화 분석', ARRAY['유통', '금융', 'IT'], ARRAY[6, 7], ARRAY['consumption', 'preferences'], 1500, 'normal'),
('명절 시즌 소비 분석', '추석/설날 등 명절 시즌 소비 패턴 분석', ARRAY['유통', '제조업'], ARRAY[1, 2, 9, 10], ARRAY['consumption', 'demographics'], 1200, 'fast'),
('ESG 경영 보고서용 데이터', 'ESG 보고서 작성을 위한 사회적 가치 관련 데이터', ARRAY['금융', '제조업', 'IT'], ARRAY[3, 4, 11, 12], ARRAY['environmental', 'social', 'governance'], 500, 'normal');