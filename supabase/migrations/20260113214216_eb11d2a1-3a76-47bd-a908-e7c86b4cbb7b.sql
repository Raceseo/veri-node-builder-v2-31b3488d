-- =====================================================
-- 가격 책정 및 수익 분배 시스템 테이블
-- =====================================================

-- 1. pricing_rules: 카테고리별 가격 정책
CREATE TABLE public.pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'survey', 'analysis', 'raw_data'
  sub_category TEXT, -- 'general', 'cross_verified', 'api_verified', etc.
  base_price_per_unit INTEGER NOT NULL DEFAULT 500, -- 기본 단가 (원)
  grade_multipliers JSONB NOT NULL DEFAULT '{"silver": 1.0, "gold": 1.5, "platinum": 2.2}'::jsonb,
  urgency_multipliers JSONB NOT NULL DEFAULT '{"normal": 1.0, "fast": 1.3, "urgent": 1.8}'::jsonb,
  quality_multipliers JSONB NOT NULL DEFAULT '{"c_grade": 1.0, "b_grade": 1.2, "a_grade": 1.8, "s_grade": 2.5}'::jsonb,
  min_sample_count INTEGER DEFAULT 10,
  max_sample_count INTEGER DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. revenue_shares: 수익 분배 정책
CREATE TABLE public.revenue_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 25.00, -- 플랫폼 수수료율 (%)
  supplier_base_percent NUMERIC(5,2) NOT NULL DEFAULT 60.00, -- 공급자 기본 비율 (%)
  quality_bonus_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00, -- 품질 인센티브 비율 (%)
  operations_percent NUMERIC(5,2) DEFAULT 10.00, -- 운영비 (플랫폼 수수료 내)
  ai_verification_percent NUMERIC(5,2) DEFAULT 8.00, -- AI 검증 비용 (플랫폼 수수료 내)
  marketing_percent NUMERIC(5,2) DEFAULT 7.00, -- 마케팅 (플랫폼 수수료 내)
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ, -- NULL이면 현재 적용중
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. data_purchases: 구매 기록
CREATE TABLE public.data_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL, -- 구매자 (기업) ID
  product_type TEXT NOT NULL, -- 'survey', 'analysis', 'raw_data'
  product_id UUID, -- 관련 설문/데이터셋 ID
  product_title TEXT,
  total_price INTEGER NOT NULL, -- 총 구매가 (원)
  platform_fee INTEGER NOT NULL, -- 플랫폼 수수료액
  supplier_pool INTEGER NOT NULL, -- 공급자 분배 풀
  unit_count INTEGER NOT NULL, -- 샘플 수
  unit_price INTEGER NOT NULL, -- 단가
  price_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb, -- 가격 상세 내역
  target_grade TEXT DEFAULT 'silver', -- 타겟 등급
  urgency TEXT DEFAULT 'normal', -- 긴급도
  has_cross_verification BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, completed, refunded, cancelled
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. supplier_payouts: 공급자 지급 기록
CREATE TABLE public.supplier_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.data_purchases(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL, -- 공급자 (개인) ID
  base_amount INTEGER NOT NULL, -- 기본 보상액
  quality_bonus INTEGER DEFAULT 0, -- 품질 보너스액
  total_amount INTEGER NOT NULL, -- 총 지급액
  trust_score_at_time INTEGER, -- 당시 신뢰도
  verification_grade TEXT, -- 당시 인증 등급
  bonus_breakdown JSONB DEFAULT '{}'::jsonb, -- 보너스 상세 내역
  payout_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. profiles 테이블 확장 (데이터 카테고리, 완성도 등)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_last_updated TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS age_group TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- 6. data_category_values: 카테고리별 시장 가치
CREATE TABLE public.data_category_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE, -- financial, health, consumption, mobility, residence, education
  display_name TEXT NOT NULL,
  base_value INTEGER NOT NULL, -- 기본가치 (원)
  current_demand_factor NUMERIC(3,2) DEFAULT 1.00, -- 수요계수 (0.5~3.0)
  current_scarcity_factor NUMERIC(3,2) DEFAULT 1.00, -- 희소성계수 (0.5~2.5)
  total_suppliers INTEGER DEFAULT 0, -- 해당 데이터 제공자 수
  active_requests INTEGER DEFAULT 0, -- 활성 설문/요청 수
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 초기 데이터 시딩
-- =====================================================

-- 가격 정책 초기 데이터
INSERT INTO public.pricing_rules (category, sub_category, base_price_per_unit) VALUES
  ('survey', 'general', 500),
  ('survey', 'cross_verified', 700),
  ('survey', 'api_verified', 1000),
  ('analysis', 'financial', 80),
  ('analysis', 'healthcare', 60),
  ('analysis', 'consumer', 40),
  ('analysis', 'mobility', 35),
  ('raw_data', 'financial', 100),
  ('raw_data', 'healthcare', 80),
  ('raw_data', 'consumer', 50);

-- 수익 분배 정책 초기 데이터 (기본값)
INSERT INTO public.revenue_shares (
  platform_fee_percent, 
  supplier_base_percent, 
  quality_bonus_percent,
  operations_percent,
  ai_verification_percent,
  marketing_percent
) VALUES (25.00, 60.00, 15.00, 10.00, 8.00, 7.00);

-- 데이터 카테고리 시장 가치 초기 데이터
INSERT INTO public.data_category_values (category, display_name, base_value) VALUES
  ('financial', '금융/자산', 50000),
  ('health', '건강/의료', 40000),
  ('consumption', '소비/구매', 25000),
  ('mobility', '이동/위치', 20000),
  ('residence', '주거/부동산', 35000),
  ('education', '학력/경력', 15000);

-- =====================================================
-- RLS 정책
-- =====================================================

-- pricing_rules: 모든 인증된 사용자 조회 가능
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active pricing rules"
  ON public.pricing_rules FOR SELECT
  USING (is_active = true);

-- revenue_shares: 모든 인증된 사용자 조회 가능
ALTER TABLE public.revenue_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active revenue shares"
  ON public.revenue_shares FOR SELECT
  USING (is_active = true);

-- data_purchases: 구매자만 자신의 구매 기록 조회
ALTER TABLE public.data_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers can view own purchases"
  ON public.data_purchases FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can insert own purchases"
  ON public.data_purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own pending purchases"
  ON public.data_purchases FOR UPDATE
  USING (auth.uid() = buyer_id AND status = 'pending');

-- supplier_payouts: 공급자만 자신의 지급 기록 조회
ALTER TABLE public.supplier_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Suppliers can view own payouts"
  ON public.supplier_payouts FOR SELECT
  USING (auth.uid() = supplier_id);

-- data_category_values: 모든 인증된 사용자 조회 가능
ALTER TABLE public.data_category_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view category values"
  ON public.data_category_values FOR SELECT
  USING (true);

-- =====================================================
-- 트리거: updated_at 자동 갱신
-- =====================================================

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_purchases_updated_at
  BEFORE UPDATE ON public.data_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_category_values_updated_at
  BEFORE UPDATE ON public.data_category_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();