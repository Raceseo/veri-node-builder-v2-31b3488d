-- 정부 마이데이터 연결 테이블
CREATE TABLE public.gov_data_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agency_type TEXT NOT NULL, -- tax, health, housing, education, military, certification
  agency_code TEXT NOT NULL,
  agency_name TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending', -- pending, syncing, completed, failed
  last_synced_at TIMESTAMP WITH TIME ZONE,
  consent_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, agency_code)
);

-- 정부 데이터 레코드 테이블
CREATE TABLE public.gov_data_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.gov_data_connections(id) ON DELETE CASCADE,
  data_category TEXT NOT NULL, -- tax, health, housing, education, military, certification
  record_type TEXT NOT NULL, -- income_cert, tax_payment, health_checkup, etc.
  record_date DATE NOT NULL,
  data_json JSONB NOT NULL DEFAULT '{}',
  verification_hash TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 정부 데이터 분석 결과 테이블
CREATE TABLE public.gov_data_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL, -- comprehensive, income_stability, health_index, residence_stability
  score INTEGER DEFAULT 0,
  grade TEXT, -- S, A, B, C, D
  details_json JSONB NOT NULL DEFAULT '{}',
  data_value_raw INTEGER DEFAULT 0,
  data_value_refined INTEGER DEFAULT 0,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, analysis_type)
);

-- RLS 활성화
ALTER TABLE public.gov_data_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_data_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_data_analysis ENABLE ROW LEVEL SECURITY;

-- gov_data_connections RLS 정책
CREATE POLICY "Users can view own gov connections"
  ON public.gov_data_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own gov connections"
  ON public.gov_data_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gov connections"
  ON public.gov_data_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gov connections"
  ON public.gov_data_connections FOR DELETE
  USING (auth.uid() = user_id);

-- gov_data_records RLS 정책
CREATE POLICY "Users can view own gov records"
  ON public.gov_data_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own gov records"
  ON public.gov_data_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- gov_data_analysis RLS 정책
CREATE POLICY "Users can view own gov analysis"
  ON public.gov_data_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own gov analysis"
  ON public.gov_data_analysis FOR ALL
  USING (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER update_gov_data_connections_updated_at
  BEFORE UPDATE ON public.gov_data_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gov_data_analysis_updated_at
  BEFORE UPDATE ON public.gov_data_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();