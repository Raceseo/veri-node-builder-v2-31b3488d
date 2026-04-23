-- ⚙️ AUTO-CAPTURED FROM REMOTE (2026-04-23)
-- Original version: 20260307065653

-- ══════════════════════════════════════════════════
-- 1. FK 인덱스 누락 수정 (성능)
-- ══════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_survey_responses_verification_id
  ON public.survey_responses(verification_id);

CREATE INDEX IF NOT EXISTS idx_user_data_category_id
  ON public.user_data(category_id);

-- ══════════════════════════════════════════════════
-- 2. notifications INSERT RLS 최종 최적화
-- ══════════════════════════════════════════════════
DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;

CREATE POLICY "service_insert_notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select current_setting('role', true)) = 'postgres'
  );
