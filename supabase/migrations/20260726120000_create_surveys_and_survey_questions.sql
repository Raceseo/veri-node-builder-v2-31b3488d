-- ============================================================================
-- A공사 구간① — 설문 테이블 신설 (surveys / survey_questions)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray가 Supabase SQL Editor에서 직접 실행
-- 작성: Claude Code (2026-07-26)
--
-- 보안 규칙(CLAUDE.md) 준수 사항:
--  · #1 새 테이블은 같은 마이그레이션에서 RLS 활성화 + 정책 포함
--  · #2 USING(true)/WITH CHECK(true) 금지 → 쓰기 정책을 만들지 않고
--       service_role(BYPASSRLS)만 쓰기 가능하도록 함
--  · 함정 문항(is_trap) 노출 차단 → 컬럼 레벨 GRANT로 authenticated에게서 회수
-- ============================================================================

-- ─── 1. surveys : 설문 정의 ──────────────────────────────────────────────────
CREATE TABLE public.surveys (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title            TEXT        NOT NULL,
  description      TEXT,
  reward_vn        INTEGER     NOT NULL DEFAULT 0,          -- 응답 완료 보상(VN)
  status           TEXT        NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'active', 'closed')),
  target_responses INTEGER,                                 -- 목표 응답 수
  response_count   INTEGER     NOT NULL DEFAULT 0,          -- 현재 응답 수(진척도)
  created_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.surveys IS '설문 정의. status=active만 사용자에게 노출.';
COMMENT ON COLUMN public.surveys.reward_vn IS '응답 완료 시 지급 보상(VN). 실제 지급은 Edge Function 경유.';

-- ─── 2. survey_questions : 설문 문항 ────────────────────────────────────────
CREATE TABLE public.survey_questions (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id     UUID        NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  order_no      INTEGER     NOT NULL,
  question_text TEXT        NOT NULL,
  question_type TEXT        NOT NULL
                  CHECK (question_type IN ('single_choice', 'multi_choice', 'scale', 'text')),
  options       JSONB       NOT NULL DEFAULT '[]'::jsonb,   -- 선택지(객관식/척도)
  is_trap       BOOLEAN     NOT NULL DEFAULT false,         -- 함정(교차검증) 문항 여부 — 사용자 비노출
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.survey_questions IS '설문 문항. is_trap 컬럼은 authenticated에게 미노출(컬럼 GRANT로 통제).';
COMMENT ON COLUMN public.survey_questions.is_trap IS '함정 문항 여부. 클라이언트에 노출 금지 — SELECT 권한에서 제외됨.';

-- 인덱스
CREATE INDEX idx_surveys_status              ON public.surveys(status);
CREATE INDEX idx_survey_questions_survey_id  ON public.survey_questions(survey_id, order_no);

-- ─── 3. RLS 활성화 ──────────────────────────────────────────────────────────
ALTER TABLE public.surveys          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

-- ─── 4. SELECT 정책 (authenticated, active 설문만) ──────────────────────────
-- surveys : status='active'인 설문만 조회 가능
CREATE POLICY "authenticated_read_active_surveys"
  ON public.surveys FOR SELECT
  TO authenticated
  USING (status = 'active');

-- survey_questions : 부모 설문이 active일 때만 문항 조회 가능
CREATE POLICY "authenticated_read_active_survey_questions"
  ON public.survey_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.surveys s
      WHERE s.id = survey_questions.survey_id
        AND s.status = 'active'
    )
  );

-- ※ INSERT/UPDATE/DELETE 정책은 만들지 않음 → authenticated/anon 쓰기 전면 차단.
--   service_role은 BYPASSRLS 이므로 정책 없이도 관리 가능(규칙 #2의 USING(true) 회피).

-- ─── 5. 함정 문항(is_trap) 노출 차단 : 컬럼 레벨 권한 ────────────────────────
-- RLS는 행 단위만 통제하므로, is_trap 열은 컬럼 GRANT로 별도 차단해야 함.
-- Supabase 기본 부여된 테이블 SELECT 권한을 회수하고, is_trap을 뺀 컬럼만 재부여.
REVOKE SELECT ON public.survey_questions FROM anon, authenticated;
GRANT  SELECT (id, survey_id, order_no, question_text, question_type, options, created_at)
  ON public.survey_questions TO authenticated;
-- anon 에게는 컬럼 SELECT를 재부여하지 않음(전면 차단).
-- ⚠️ 클라이언트는 survey_questions 조회 시 select('*') 대신 위 허용 컬럼만 명시할 것.
--    (is_trap 을 포함해 select 하면 "permission denied for column is_trap" 오류)
