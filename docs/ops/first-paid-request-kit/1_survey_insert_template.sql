-- ============================================================================
-- [1] 다문항 설문 등록 SQL 템플릿  (첫 유료 의뢰 대응 키트)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: Ray 가 Supabase SQL Editor 에서 직접 실행. Claude Code 는 DB 직접 실행 안 함.
-- 스키마 근거: supabase/migrations/20260726120000_create_surveys_and_survey_questions.sql
--             + 20260813090000_grant_survey_reward_validate_completeness_time.sql
-- ----------------------------------------------------------------------------
-- 언제 쓰나: 문의 문항이 확정되면, 설문 1개 + 문항 N개를 한 번에 draft 로 넣는다.
--            검수 후 [블록 C] 로 active 전환한다. (2단계: draft → 검수 → active)
-- ============================================================================


-- ┌────────────────────────────────────────────────────────────────────────┐
-- │ 유형별 options / answer 작성 규칙 (코드 실측 — src/.../AntiCherryPickerSurveyView.tsx) │
-- └────────────────────────────────────────────────────────────────────────┘
--   options 는 "문자열 JSON 배열" 이다. 예: ["보기A","보기B","보기C"]  (배열 순서 = 화면 표시 순서)
--
--   · single_choice : options 사용. 응답자가 1개 선택. 저장 answer = 선택한 보기 문자열.
--   · multi_choice  : options 사용. 응답자가 1개 이상 선택. 저장 answer = 선택배열의 JSON 문자열
--                     예: ["보기1","보기3"]  (집계 시 unnest 필요 — [3]번 파일 참고)
--   · scale         : options 미사용(반드시 []). UI 가 1~5 고정 척도로 렌더하고
--                     양끝 라벨은 "전혀 아니다"↔"매우 그렇다" 로 화면에 하드코딩됨.
--                     저장 answer = "1"~"5" 문자열.  ← options 에 뭘 넣어도 무시된다.
--   · text          : options 미사용(반드시 []). 자유서술. 저장 answer = 원문.
--                     (UI 는 100자 이상 붙여넣기를 차단한다.)
--
--   is_trap : 기본 false. 함정(교차검증) 문항 표시용. 함정도 응답자에게는 "일반 문항처럼"
--             보이고, 보상 완성도 검사(전 문항 필수)에 포함된다. 첫 유료 설문은 false 권장.
--
--   ⚠️ reward_vn : 응답 1건 완료 보상(VN). 값은 Ray 가 정한다. 0 이면 보상 RPC 가 거부한다.
--   ⚠️ 최소시간 게이트: 한 응답자의 time_spent 합계가 30초 미만이면 보상 미적립(too_fast).
--   ⚠️ 완성도 게이트: 전 문항(함정 포함)을 답해야 보상 적립(incomplete_survey 거부).


-- ============================================================================
-- [블록 A] 설문 + 문항 등록  (status='draft' 로 먼저 넣는다)
-- ----------------------------------------------------------------------------
-- ⚙️ 문항 블록은 아래 VALUES 의 한 줄 = 문항 1개. 복사·붙여넣기로 늘린다.
--    order_no 는 1부터 연속으로. 화면 표시 순서 = order_no 오름차순.
--    한글은 $$달러 인용$$ 으로 감싸 작은따옴표(') 충돌을 피한다. jsonb 도 $$...$$::jsonb 로.
-- ============================================================================
WITH new_survey AS (
  INSERT INTO public.surveys
    (title, description, reward_vn, status, target_responses, created_by)
  VALUES (
    $$여기에 설문 제목$$,                 -- title  (검수 SELECT 가 이 제목으로 설문을 찾는다 — 고유하게)
    $$여기에 설문 설명(선택)$$,           -- description
    300,                                  -- reward_vn = 제공자 리워드(VN). 12문항 기준 300. 수요자 단가 800원과
                                          --   혼동 금지 — 800은 고객이 내는 돈, 300은 응답자에게 주는 돈.
    'draft',                              -- status     ← 반드시 draft 로 시작(검수 전 비노출)
    100,                                  -- target_responses ← 목표 응답 수
    NULL                                  -- created_by ← NULL 유지.
                                          --   (내 계정으로 남기려면 NULL 대신:
                                          --    (SELECT id FROM auth.users WHERE email = $$sangjun.seo@gmail.com$$) )
  )
  RETURNING id
)
INSERT INTO public.survey_questions
  (survey_id, order_no, question_text, question_type, options, is_trap)
SELECT ns.id, q.order_no, q.question_text, q.question_type, q.options, q.is_trap
FROM new_survey ns
CROSS JOIN (VALUES
  -- ── 유형별 예시 1개씩 (실제 문항으로 교체) ─────────────────────────────
  -- (order_no, question_text,              question_type,   options,                          is_trap)
  (1, $$[단일] 성별을 선택해 주세요$$,        'single_choice', $$["남성","여성","선택 안 함"]$$::jsonb, false),
  (2, $$[복수] 최근 1개월 이용한 서비스(복수 선택)$$,
                                            'multi_choice',  $$["배달앱","OTT","쇼핑","금융","교육"]$$::jsonb, false),
  (3, $$[척도] 이 서비스에 얼마나 만족하십니까$$,
                                            'scale',         $$[]$$::jsonb, false),   -- scale 은 반드시 []
  (4, $$[주관] 개선이 필요한 점을 자유롭게 적어 주세요$$,
                                            'text',          $$[]$$::jsonb, false)    -- text 는 반드시 []
  -- ── 문항을 늘리려면 위 형식으로 줄을 추가 (order_no 5,6,7 …) ──────────
  -- ,(5, $$[단일] …$$, 'single_choice', $$["…","…"]$$::jsonb, false)
) AS q(order_no, question_text, question_type, options, is_trap);


-- ============================================================================
-- [블록 B] 등록 직후 검증 SELECT  (블록 A 와 따로 실행 — 마지막 SELECT 결과만 화면에 뜸)
-- ----------------------------------------------------------------------------
-- 확인 항목: 설문 1건, 문항 수, 유형 분포, order_no 순서·중복, options 내용
-- ============================================================================

-- B-1) 설문 헤더 + 문항 수 (제목으로 조회 — 방금 넣은 draft 를 찾는다)
SELECT s.id            AS survey_id,
       s.title, s.status, s.reward_vn, s.target_responses,
       COUNT(q.id)     AS 문항수,
       s.created_at
FROM public.surveys s
LEFT JOIN public.survey_questions q ON q.survey_id = s.id
WHERE s.title = $$여기에 설문 제목$$          -- ← 블록 A 의 title 과 동일하게
GROUP BY s.id, s.title, s.status, s.reward_vn, s.target_responses, s.created_at;

-- B-2) 문항 목록 (순서·유형·options 눈으로 확인). survey_id 는 B-1 결과값으로 교체.
SELECT order_no, question_type, is_trap, question_text, options
FROM public.survey_questions
WHERE survey_id = '<SURVEY_ID>'
ORDER BY order_no;

-- B-3) 정합성 점검 (아래 3건 모두 0 이어야 정상)
SELECT
  COUNT(*) FILTER (WHERE question_type NOT IN ('single_choice','multi_choice','scale','text')) AS 잘못된_유형수,
  COUNT(*) FILTER (WHERE question_type IN ('single_choice','multi_choice')
                    AND jsonb_array_length(options) < 2)                                        AS 보기부족_객관식,
  (SELECT COUNT(*) - COUNT(DISTINCT order_no) FROM public.survey_questions
    WHERE survey_id = '<SURVEY_ID>')                                                            AS order_no_중복수
FROM public.survey_questions
WHERE survey_id = '<SURVEY_ID>';


-- ============================================================================
-- [블록 C] 검수 통과 후 active 전환  (여기서부터 응답자에게 노출된다)
-- ----------------------------------------------------------------------------
-- RLS: draft/closed 는 사용자에게 안 보이고, active 만 보인다.
-- ============================================================================
UPDATE public.surveys
SET status = 'active', updated_at = now()
WHERE id = '<SURVEY_ID>' AND status = 'draft';

-- 되돌리기(비상): active → draft (다시 숨김)
-- UPDATE public.surveys SET status='draft', updated_at=now() WHERE id='<SURVEY_ID>';
