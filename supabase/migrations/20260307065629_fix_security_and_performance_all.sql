-- ⚙️ AUTO-CAPTURED FROM REMOTE (2026-04-23)
-- Original version: 20260307065629

-- ══════════════════════════════════════════════════
-- 1. transactions 타입 CONSTRAINT 추가 (보안)
-- ══════════════════════════════════════════════════
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type = ANY (ARRAY[
    'sale', 'purchase', 'withdrawal', 'deposit',
    'verification_reward', 'survey_reward', 'refund',
    'platform_fee', 'bonus', 'adjustment'
  ]));

-- ══════════════════════════════════════════════════
-- 2. withdrawal_requests ↔ approvals 연결 (이중 승인)
-- ══════════════════════════════════════════════════
ALTER TABLE public.approvals
  ADD COLUMN IF NOT EXISTS withdrawal_id UUID REFERENCES public.withdrawal_requests(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_approvals_withdrawal_id
  ON public.approvals(withdrawal_id);

-- ══════════════════════════════════════════════════
-- 3. profiles 잔액 컬럼 통일 (balance → vn_balance로 통합)
-- vn_balance를 공식 잔액으로 사용, balance는 동기화
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION sync_balance_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- vn_balance 변경 시 balance도 동기화
  IF NEW.vn_balance IS DISTINCT FROM OLD.vn_balance THEN
    NEW.balance = NEW.vn_balance;
  END IF;
  -- balance 변경 시 vn_balance도 동기화
  IF NEW.balance IS DISTINCT FROM OLD.balance THEN
    NEW.vn_balance = NEW.balance;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER sync_balance_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_balance_columns();

-- ══════════════════════════════════════════════════
-- 4. RLS 성능 개선 (notifications - auth.uid() 최적화)
-- ══════════════════════════════════════════════════
DROP POLICY IF EXISTS "users_read_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;

-- 최적화된 RLS 정책 (select auth.uid() 방식)
CREATE POLICY "users_read_own_notifications"
  ON public.notifications FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "users_update_own_notifications"
  ON public.notifications FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "service_insert_notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    OR current_setting('role') = 'postgres'
  );

-- ══════════════════════════════════════════════════
-- 5. 미사용 인덱스 정리 (성능)
-- ══════════════════════════════════════════════════
DROP INDEX IF EXISTS public.idx_survey_responses_verification_id;
DROP INDEX IF EXISTS public.idx_user_data_category_id;

-- 대신 실제 사용되는 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id
  ON public.survey_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_user_data_user_id
  ON public.user_data(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON public.transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_type
  ON public.transactions(type);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id
  ON public.withdrawal_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status
  ON public.withdrawal_requests(status);

CREATE INDEX IF NOT EXISTS idx_approvals_withdrawal_id_status
  ON public.approvals(withdrawal_id, status);

-- ══════════════════════════════════════════════════
-- 6. portfolio_assemblies 테이블 정리
-- (VeriNode와 무관한 테이블 — 비활성화)
-- ══════════════════════════════════════════════════
ALTER TABLE public.portfolio_assemblies DISABLE ROW LEVEL SECURITY;
-- 실제 삭제는 안전하게 Ray님이 직접 확인 후 진행 권장
-- DROP TABLE IF EXISTS public.portfolio_assemblies;

-- ══════════════════════════════════════════════════
-- 7. user_rewards ↔ profiles.total_earned 동기화 트리거
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION sync_total_earned()
RETURNS TRIGGER AS $$
BEGIN
  -- transactions에 sale/survey_reward 입금 시 total_earned 자동 업데이트
  IF NEW.type IN ('sale', 'survey_reward', 'verification_reward', 'bonus')
     AND NEW.amount > 0 THEN
    UPDATE public.profiles
    SET total_earned = COALESCE(total_earned, 0) + NEW.amount
    WHERE id = NEW.user_id;

    -- user_rewards 테이블도 동기화
    INSERT INTO public.user_rewards (user_id, total_earned, updated_at)
    VALUES (NEW.user_id, NEW.amount, now())
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_earned = user_rewards.total_earned + NEW.amount,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER sync_total_earned_on_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION sync_total_earned();

-- ══════════════════════════════════════════════════
-- 8. withdrawal_requests status CONSTRAINT 추가
-- ══════════════════════════════════════════════════
ALTER TABLE public.withdrawal_requests
  DROP CONSTRAINT IF EXISTS withdrawal_requests_status_check;

ALTER TABLE public.withdrawal_requests
  ADD CONSTRAINT withdrawal_requests_status_check
  CHECK (status = ANY (ARRAY[
    'pending', 'partial', 'approved', 'rejected', 'completed', 'cancelled'
  ]));
