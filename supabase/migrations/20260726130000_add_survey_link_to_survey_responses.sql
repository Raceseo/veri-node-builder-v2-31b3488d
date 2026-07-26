-- ============================================================================
-- A공사 구간③ (1단계) — survey_responses 를 surveys/survey_questions 와 연결
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray가 Supabase SQL Editor에서 직접 실행
-- 작성: Claude Code (2026-07-26)
--
-- 배경(정합성 점검 결과):
--  · 기존 survey_responses 는 verification_history 기준(verification_id FK)이라
--    DB 설문(surveys) 응답을 담을 survey_id 컬럼이 없었음.
--  · question_id 는 INTEGER 라 survey_questions.id(uuid)를 담을 수 없음
--    → question_id 에는 order_no(정수)를 저장하고, 정확 연결용 survey_question_id(uuid) 를 별도 추가.
--  · 두 신규 컬럼 모두 NULLABLE → 기존 인증(verification) 모드 응답(survey_id=null)과 그대로 공존.
--  · RLS 변경 불필요: 기존 user_id 기준 SELECT/INSERT 정책이 컬럼과 무관하게 그대로 적용됨.
--    (참고: 20251229083723_..._survey_responses INSERT 정책 = WITH CHECK (auth.uid() = user_id))
-- ============================================================================

ALTER TABLE public.survey_responses
  ADD COLUMN survey_id          UUID REFERENCES public.surveys(id)          ON DELETE CASCADE,
  ADD COLUMN survey_question_id UUID REFERENCES public.survey_questions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.survey_responses.survey_id IS 'DB 설문(surveys) 응답일 때의 설문 FK. 인증 모드 응답은 null.';
COMMENT ON COLUMN public.survey_responses.survey_question_id IS '정확 문항 연결용 survey_questions FK. question_id 정수(order_no)와 병행.';

-- 설문별 응답 조회 성능
CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
