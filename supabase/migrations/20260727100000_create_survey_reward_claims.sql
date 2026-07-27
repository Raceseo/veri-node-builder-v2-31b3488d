-- ============================================================================
-- A공사 구간④ — 설문 보상 적립 중복 방지 테이블 (survey_reward_claims)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray 가 Supabase SQL Editor 에서 직접 실행
-- 작성: Claude Code (2026-07-27)
--
-- 목적:
--  · claim-survey-reward Edge Function 이 "한 사용자가 한 설문에 1회만 보상"을
--    보장하도록 UNIQUE(survey_id, user_id) 로 중복 적립을 원자적으로 차단.
--  · transactions 는 감사 로그라 unique 제약이 없어 동시요청(race)에 뚫리므로,
--    적립 게이트를 이 전용 테이블로 둔다.
--
-- 보안 규칙(CLAUDE.md) 준수:
--  · #1 새 테이블은 같은 마이그레이션에서 RLS 활성화 + 정책 포함
--  · #2 USING(true)/WITH CHECK(true) 금지 → 쓰기 정책을 만들지 않아
--       service_role(BYPASSRLS)만 write 가능. 읽기는 본인 행만 SELECT.
-- ============================================================================

CREATE TABLE public.survey_reward_claims (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id      UUID        NOT NULL REFERENCES public.surveys(id)      ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES auth.users(id)          ON DELETE CASCADE,
  reward_vn      INTEGER     NOT NULL,
  transaction_id UUID        REFERENCES public.transactions(id)          ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (survey_id, user_id)                       -- ← 중복 적립 원자적 차단
);

COMMENT ON TABLE public.survey_reward_claims IS '설문 보상 적립 기록. (survey_id,user_id) 유일 — 1인 1설문 1회 적립.';

CREATE INDEX idx_survey_reward_claims_user ON public.survey_reward_claims(user_id);

-- RLS
ALTER TABLE public.survey_reward_claims ENABLE ROW LEVEL SECURITY;

-- 본인 적립 내역만 조회 가능(선택). INSERT/UPDATE/DELETE 정책 없음 → service_role 만 write.
CREATE POLICY "read_own_reward_claims"
  ON public.survey_reward_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
