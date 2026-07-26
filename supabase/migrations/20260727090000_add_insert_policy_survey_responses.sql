-- ============================================================================
-- A공사 구간③ (보강) — survey_responses INSERT 정책 복원
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray 가 Supabase SQL Editor 에서 직접 실행 (2026-07-27 적용 완료)
-- 작성: Claude Code (2026-07-27)
--
-- 배경 (문서 ≠ 실물):
--  · 원본 마이그레이션 20251229083723 에는 survey_responses 의 INSERT 정책
--    "Users can insert own survey responses" (WITH CHECK auth.uid() = user_id) 가
--    분명히 정의돼 있으나, 서울 실DB 로 이관(이사)되는 과정에서 이 INSERT 정책만
--    누락되어 실물에는 SELECT 정책만 존재했음.
--  · 그 결과 DB 설문 응답 저장이 42501 (new row violates row-level security policy)
--    로 거부됨. 코드/페이로드/클라이언트는 모두 정상이었고, 실DB 정책 누락이 유일 원인.
--  · 어제(2026-07-26)의 "유령 테이블"과 동일 계열의 문서-실물 불일치 사례.
--
-- ⚠️ 이 파일은 기록용입니다. 실제 정책은 2026-07-27 SQL Editor 에서 이미 적용됨.
--    재실행이 안전하도록 DROP POLICY IF EXISTS 후 CREATE 하도록 작성.
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own survey responses" ON public.survey_responses;

CREATE POLICY "Users can insert own survey responses"
  ON public.survey_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
