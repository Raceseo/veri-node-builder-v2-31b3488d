-- ============================================================================
-- 구간④ 보강 — survey_reward_claims 중복 UNIQUE 제약 정리
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray 가 Supabase SQL Editor 에서 직접 실행 (2026-07-27 적용 완료)
-- 작성: Claude Code (2026-07-27)
--
-- 배경 (문서 ≠ 실물):
--  · 서울 실물 survey_reward_claims 에 (survey_id, user_id) UNIQUE 제약이 2개 중복 존재:
--      - survey_reward_claims_survey_id_user_id_key   (본 repo 마이그레이션이 만든 표준본)
--      - survey_reward_claims_survey_user_unique       (실물에만 있던 중복본)
--  · grant_survey_reward RPC 의 ON CONFLICT (survey_id, user_id) 는 컬럼 기반이라
--    UNIQUE 하나만 있으면 되므로, 중복본을 제거해 위생 정리.
--
-- ⚠️ 이 파일은 기록용입니다. 실제 정리는 2026-07-27 SQL Editor 에서 이미 적용됨.
-- ============================================================================

ALTER TABLE public.survey_reward_claims
  DROP CONSTRAINT IF EXISTS survey_reward_claims_survey_user_unique;
