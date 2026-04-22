-- 1. withdrawals 테이블에 2FA 관련 컬럼 추가
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS otp_code TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;

-- 2. 출금 감사 로그 테이블 생성
CREATE TABLE IF NOT EXISTS public.withdrawal_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID REFERENCES public.withdrawals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS 활성화
ALTER TABLE public.withdrawal_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. 사용자는 자신의 감사 로그만 조회 가능
CREATE POLICY "Users can view own audit logs"
ON public.withdrawal_audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- 5. 서비스 역할만 감사 로그 삽입 가능 (Edge Function에서 service role key 사용)
CREATE POLICY "Service role can insert audit logs"
ON public.withdrawal_audit_logs
FOR INSERT
WITH CHECK (true);

-- 6. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_logs_withdrawal_id 
ON public.withdrawal_audit_logs(withdrawal_id);

CREATE INDEX IF NOT EXISTS idx_withdrawal_audit_logs_user_id 
ON public.withdrawal_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_otp_expires_at 
ON public.withdrawals(otp_expires_at) 
WHERE otp_verified = false;