-- =============================================
-- 한국형 B2B/B2C 결제 시스템 스키마
-- =============================================

-- 1. 기업 계정 정보
CREATE TABLE public.corporate_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_registration_number TEXT NOT NULL UNIQUE,
  company_name_official TEXT NOT NULL,
  ceo_name TEXT,
  business_type TEXT,
  business_category TEXT,
  company_address TEXT,
  tax_email TEXT,
  payment_method TEXT DEFAULT 'prepaid' CHECK (payment_method IN ('prepaid', 'postpaid', 'virtual_account')),
  credit_limit INTEGER DEFAULT 0,
  settlement_cycle TEXT DEFAULT 'monthly' CHECK (settlement_cycle IN ('monthly', 'quarterly')),
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. 기업 멤버 (담당자/결재자)
CREATE TABLE public.corporate_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'purchaser', 'approver', 'viewer')),
  department TEXT,
  position TEXT,
  approval_limit INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(corporate_account_id, user_id)
);

-- 3. 구매 결재 요청
CREATE TABLE public.purchase_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID,
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id),
  requester_id UUID NOT NULL,
  approver_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_amount INTEGER NOT NULL,
  approval_note TEXT,
  request_details JSONB DEFAULT '{}',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. 세금계산서
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID,
  corporate_account_id UUID NOT NULL REFERENCES public.corporate_accounts(id),
  invoice_number TEXT NOT NULL UNIQUE,
  supply_amount INTEGER NOT NULL,
  vat_amount INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  invoice_pdf_url TEXT,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. 가상계좌
CREATE TABLE public.virtual_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  corporate_account_id UUID REFERENCES public.corporate_accounts(id),
  order_id UUID,
  bank_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  amount INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. 결제 주문 (개인 + 기업 공용)
CREATE TABLE public.payment_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  corporate_account_id UUID REFERENCES public.corporate_accounts(id),
  order_type TEXT NOT NULL CHECK (order_type IN ('membership', 'vn_charge', 'premium_service', 'data_purchase')),
  amount INTEGER NOT NULL,
  vat_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('card', 'kakaopay', 'naverpay', 'tosspay', 'phone', 'bank_transfer', 'virtual_account', 'postpaid')),
  pg_provider TEXT,
  pg_transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. 개인 구독 관리
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  price INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_billing_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  billing_key_encrypted TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. VN 충전 내역
CREATE TABLE public.vn_charge_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_order_id UUID REFERENCES public.payment_orders(id),
  vn_amount INTEGER NOT NULL,
  bonus_vn INTEGER NOT NULL DEFAULT 0,
  total_vn INTEGER NOT NULL,
  krw_amount INTEGER NOT NULL,
  exchange_rate NUMERIC(10, 4) DEFAULT 10.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. 환불 내역
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_order_id UUID NOT NULL REFERENCES public.payment_orders(id),
  user_id UUID NOT NULL,
  refund_amount INTEGER NOT NULL,
  reason TEXT,
  reason_category TEXT CHECK (reason_category IN ('change_of_mind', 'service_issue', 'duplicate_payment', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  admin_note TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. 데이터 활용 동의
CREATE TABLE public.data_usage_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  corporate_account_id UUID REFERENCES public.corporate_accounts(id),
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'data_usage', 'third_party', 'marketing', 'recurring_payment')),
  is_agreed BOOLEAN NOT NULL DEFAULT false,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  ip_address TEXT,
  user_agent TEXT,
  agreed_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- RLS 정책
-- =============================================

ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vn_charge_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_usage_consents ENABLE ROW LEVEL SECURITY;

-- corporate_accounts 정책
CREATE POLICY "Users can view their corporate accounts"
  ON public.corporate_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create corporate accounts"
  ON public.corporate_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their corporate accounts"
  ON public.corporate_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- corporate_members 정책
CREATE POLICY "Members can view their corporate memberships"
  ON public.corporate_members FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.corporate_accounts ca 
    WHERE ca.id = corporate_account_id AND ca.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage corporate members"
  ON public.corporate_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.corporate_accounts ca 
    WHERE ca.id = corporate_account_id AND ca.user_id = auth.uid()
  ));

-- purchase_approvals 정책
CREATE POLICY "Users can view related approvals"
  ON public.purchase_approvals FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = approver_id);

CREATE POLICY "Requesters can create approvals"
  ON public.purchase_approvals FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Approvers can update approvals"
  ON public.purchase_approvals FOR UPDATE
  USING (auth.uid() = approver_id);

-- invoices 정책
CREATE POLICY "Users can view their invoices"
  ON public.invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.corporate_accounts ca 
    WHERE ca.id = corporate_account_id AND ca.user_id = auth.uid()
  ));

-- virtual_accounts 정책
CREATE POLICY "Users can view their virtual accounts"
  ON public.virtual_accounts FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.corporate_accounts ca 
    WHERE ca.id = corporate_account_id AND ca.user_id = auth.uid()
  ));

-- payment_orders 정책
CREATE POLICY "Users can view their payment orders"
  ON public.payment_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment orders"
  ON public.payment_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their payment orders"
  ON public.payment_orders FOR UPDATE
  USING (auth.uid() = user_id);

-- subscriptions 정책
CREATE POLICY "Users can view their subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- vn_charge_records 정책
CREATE POLICY "Users can view their charge records"
  ON public.vn_charge_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create charge records"
  ON public.vn_charge_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- refunds 정책
CREATE POLICY "Users can view their refunds"
  ON public.refunds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create refund requests"
  ON public.refunds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- data_usage_consents 정책
CREATE POLICY "Users can view their consents"
  ON public.data_usage_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create consents"
  ON public.data_usage_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their consents"
  ON public.data_usage_consents FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- 인덱스
-- =============================================

CREATE INDEX idx_corporate_accounts_user_id ON public.corporate_accounts(user_id);
CREATE INDEX idx_corporate_accounts_brn ON public.corporate_accounts(business_registration_number);
CREATE INDEX idx_corporate_members_user_id ON public.corporate_members(user_id);
CREATE INDEX idx_corporate_members_account_id ON public.corporate_members(corporate_account_id);
CREATE INDEX idx_purchase_approvals_status ON public.purchase_approvals(status);
CREATE INDEX idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX idx_invoices_corporate_account ON public.invoices(corporate_account_id);
CREATE INDEX idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX idx_payment_orders_status ON public.payment_orders(status);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_vn_charge_records_user_id ON public.vn_charge_records(user_id);
CREATE INDEX idx_refunds_status ON public.refunds(status);

-- =============================================
-- 트리거: updated_at 자동 갱신
-- =============================================

CREATE TRIGGER update_corporate_accounts_updated_at
  BEFORE UPDATE ON public.corporate_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corporate_members_updated_at
  BEFORE UPDATE ON public.corporate_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 세금계산서 번호 생성 함수
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
  seq INTEGER;
BEGIN
  year_month := to_char(now(), 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8 FOR 6) AS INTEGER)), 0) + 1
  INTO seq
  FROM public.invoices
  WHERE invoice_number LIKE 'INV' || year_month || '%';
  
  new_number := 'INV' || year_month || LPAD(seq::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;