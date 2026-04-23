-- ⚙️ AUTO-CAPTURED FROM REMOTE (2026-04-23)
-- Original version: 20260307064756

-- 기존 너무 허용적인 INSERT 정책 삭제
DROP POLICY IF EXISTS "service_insert_notifications" ON public.notifications;

-- ✅ 서버 트리거(SECURITY DEFINER)만 INSERT 가능하도록 수정
-- 일반 사용자는 직접 알림 생성 불가, 트리거 함수만 가능
CREATE POLICY "service_insert_notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    -- 본인 user_id로만 삽입 가능 (트리거 함수가 올바른 user_id 사용)
    auth.uid() = user_id
    OR
    -- SECURITY DEFINER 함수에서 호출 시 허용
    current_setting('role') = 'postgres'
  );
