-- ============================================================================
-- B-29 1단계 — 인증 보상 적립 중복 방지 테이블 (verification_reward_claims)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray 가 Supabase SQL Editor 에서 직접 실행
-- 작성: Claude Code (2026-08-05)
--
-- 목적:
--  · claim-verification-reward Edge Function 이 "한 사용자가 1회만 인증 보상"을
--    보장하도록 UNIQUE(user_id) 로 중복 적립을 원자적으로 차단.
--  · 인증은 1회성이므로 설문(survey_id, user_id 복합키)과 달리 사용자 단일 키다.
--    (Ray 확정 1항, 2026-08-04)
--  · transactions 는 감사 로그라 unique 제약이 없어 동시요청(race)에 뚫리므로,
--    적립 게이트를 이 전용 테이블로 둔다.
--
-- 보안 규칙(CLAUDE.md) 준수:
--  · #1 새 테이블은 같은 마이그레이션에서 RLS 활성화 + 정책 포함
--  · #2 USING(true)/WITH CHECK(true) 금지 → 쓰기 정책을 만들지 않아
--       service_role(BYPASSRLS)만 write 가능. 읽기는 본인 행만 SELECT.
--
-- 참조 구현: 20260727100000_create_survey_reward_claims.sql
-- ============================================================================

CREATE TABLE public.verification_reward_claims (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  reward_vn      INTEGER     NOT NULL,
  transaction_id UUID        REFERENCES public.transactions(id)   ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)                                  -- ← 중복 적립 원자적 차단
);

COMMENT ON TABLE public.verification_reward_claims IS
  '인증 보상 적립 기록. user_id 유일 — 1인 1회 적립. 인증은 1회성이라 사용자 단일 키.';

-- UNIQUE(user_id) 가 인덱스를 만들므로 별도 인덱스 불필요.

-- RLS
ALTER TABLE public.verification_reward_claims ENABLE ROW LEVEL SECURITY;

-- 본인 적립 내역만 조회 가능. INSERT/UPDATE/DELETE 정책 없음 → service_role 만 write.
CREATE POLICY "read_own_verification_reward_claims"
  ON public.verification_reward_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
