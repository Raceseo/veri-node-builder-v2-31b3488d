-- 거래 리포트 테이블
CREATE TABLE public.transaction_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.data_purchases(id) ON DELETE CASCADE,
  report_number TEXT UNIQUE NOT NULL,
  buyer_id UUID NOT NULL,
  total_suppliers INTEGER DEFAULT 0,
  total_distributed INTEGER DEFAULT 0,
  avg_trust_score DECIMAL(5,2),
  grade_distribution JSONB DEFAULT '{}',
  quality_metrics JSONB DEFAULT '{}',
  cost_breakdown JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 플랫폼 KPI 스냅샷 테이블 (일별 집계)
CREATE TABLE public.platform_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  total_gmv BIGINT DEFAULT 0,
  platform_revenue BIGINT DEFAULT 0,
  supplier_payouts BIGINT DEFAULT 0,
  active_suppliers INTEGER DEFAULT 0,
  active_corporates INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  avg_trust_score DECIMAL(5,2),
  avg_data_purity DECIMAL(5,2),
  take_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_date)
);

-- RLS 정책 활성화
ALTER TABLE public.transaction_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_kpi_snapshots ENABLE ROW LEVEL SECURITY;

-- 거래 당사자(구매자)는 자신의 리포트 조회 가능
CREATE POLICY "Buyers can view their transaction reports" 
ON public.transaction_reports 
FOR SELECT 
USING (auth.uid() = buyer_id);

-- 공급자는 참여한 거래의 리포트 조회 가능
CREATE POLICY "Suppliers can view participated transaction reports" 
ON public.transaction_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_payouts sp 
    WHERE sp.purchase_id = transaction_reports.purchase_id 
    AND sp.supplier_id = auth.uid()
  )
);

-- 인증된 사용자는 KPI 스냅샷 조회 가능 (VC 데모용)
CREATE POLICY "Authenticated users can view KPI snapshots" 
ON public.platform_kpi_snapshots 
FOR SELECT 
TO authenticated
USING (true);

-- 시스템이 리포트 생성 가능 (service role)
CREATE POLICY "System can insert transaction reports" 
ON public.transaction_reports 
FOR INSERT 
WITH CHECK (true);

-- 시스템이 KPI 스냅샷 생성 가능 (service role)
CREATE POLICY "System can insert KPI snapshots" 
ON public.platform_kpi_snapshots 
FOR INSERT 
WITH CHECK (true);

-- 리포트 번호 생성 함수
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TXN-' || TO_CHAR(NOW(), 'YYYY-MMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 인덱스 추가
CREATE INDEX idx_transaction_reports_buyer_id ON public.transaction_reports(buyer_id);
CREATE INDEX idx_transaction_reports_purchase_id ON public.transaction_reports(purchase_id);
CREATE INDEX idx_platform_kpi_snapshots_date ON public.platform_kpi_snapshots(snapshot_date DESC);