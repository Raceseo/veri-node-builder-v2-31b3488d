-- =============================================
-- fix_security_all: verification_history RLS 보안 강화
-- =============================================

-- 작업 1: verification_history 기존 INSERT 정책 삭제 후 시스템 전용으로 교체
-- 기존에는 일반 사용자가 직접 INSERT 가능했으나, 시스템(service_role)만 가능하도록 변경

DROP POLICY IF EXISTS "Users can insert own verification history" ON public.verification_history;

CREATE POLICY "시스템만 삽입가능" ON public.verification_history
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 참고: 기존 SELECT 정책 "Users can view own verification history"는 
-- auth.uid() = user_id 조건으로 이미 안전하므로 유지합니다.