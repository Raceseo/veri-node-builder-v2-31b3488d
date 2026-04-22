-- 데이터 검증 기록 테이블
CREATE TABLE public.data_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data_type TEXT NOT NULL, -- 'profile', 'survey', 'document', 'sns'
  verification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'suspicious'
  ai_generated_check BOOLEAN DEFAULT NULL, -- AI 가공 여부 검사 결과
  identity_match_check BOOLEAN DEFAULT NULL, -- 명의 일치 여부 검사 결과
  purity_score INTEGER DEFAULT 0, -- 0-100
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ DEFAULT NULL
);

-- 시스템 신뢰 위협 알림 테이블
CREATE TABLE public.trust_threat_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  verification_id UUID REFERENCES public.data_verifications(id) ON DELETE CASCADE,
  threat_type TEXT NOT NULL, -- 'ai_generated', 'identity_mismatch', 'pattern_anomaly', 'multiple_attempts'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID DEFAULT NULL,
  resolved_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 Purity Score 테이블
CREATE TABLE public.user_purity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  overall_score INTEGER DEFAULT 100, -- 0-100
  ai_authenticity_score INTEGER DEFAULT 100,
  identity_consistency_score INTEGER DEFAULT 100,
  data_quality_score INTEGER DEFAULT 100,
  verification_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.data_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_threat_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purity_scores ENABLE ROW LEVEL SECURITY;

-- 사용자 본인 데이터 조회
CREATE POLICY "Users can view own verifications" ON public.data_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own verifications" ON public.data_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own purity score" ON public.user_purity_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purity score" ON public.user_purity_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purity score" ON public.user_purity_scores FOR UPDATE USING (auth.uid() = user_id);

-- 알림은 관리자만 조회 가능 (데모용으로 모두 조회 허용)
CREATE POLICY "Alerts are viewable by all authenticated" ON public.trust_threat_alerts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Alerts can be inserted by system" ON public.trust_threat_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);