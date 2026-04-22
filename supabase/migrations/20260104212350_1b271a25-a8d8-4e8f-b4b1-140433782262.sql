-- 출금 요청 테이블 생성
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  fee NUMERIC DEFAULT 0,
  net_amount NUMERIC GENERATED ALWAYS AS (amount - COALESCE(fee, 0)) STORED,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화 (보안 핵심)
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- 본인 출금 내역만 조회 가능 (경쟁사 노출 방지)
CREATE POLICY "Users can view own withdrawals"
ON public.withdrawals
FOR SELECT
USING (auth.uid() = user_id);

-- 본인만 출금 요청 가능
CREATE POLICY "Users can create own withdrawals"
ON public.withdrawals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 본인 출금만 취소 가능 (pending 상태만)
CREATE POLICY "Users can cancel own pending withdrawals"
ON public.withdrawals
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX idx_withdrawals_requested_at ON public.withdrawals(requested_at DESC);