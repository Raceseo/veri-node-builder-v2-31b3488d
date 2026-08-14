-- ============================================================================
-- [3] 결과 추출 쿼리 2종  (첫 유료 의뢰 대응 키트)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)  /  실행: Ray, SQL Editor
-- ----------------------------------------------------------------------------
-- 언제 쓰나: 설문 마감(closed) 후 결과를 의뢰인에게 넘기기 전, 원본표와 집계를 뽑을 때.
--
-- 🔒 익명화 절대조항: 어떤 추출에도 응답자 개인식별정보(user_id 원본·이메일·이름)를
--    내보내지 않는다. 응답자는 DENSE_RANK 로 만든 익명 순번(R0001…)으로만 표기한다.
--    (survey_responses 자체에는 이름·이메일이 없다. user_id 도 출력에서 제외한다.)
--
-- ✅ 기본값은 "검증 통과자만"(보상 적립자) 추출이다 — 유료 상품이 파는 것이 그것이므로.
--    전체(미검증 포함)를 뽑으려면 각 쿼리의 [검증필터] 주석 지시를 따른다.
-- ============================================================================


-- ############################################################################
-- (a) 원본 매트릭스 : 익명 응답자 × 문항 × 답변   (CSV 내보내기용)
-- ############################################################################
--   · survey_question_id 로 조인해 "이 설문에 속한" 응답만 뽑는다(타 설문 혼입 차단).
--   · multi_choice 의 answer 는 JSON 배열 문자열(예 ["A","C"]) 그대로 나온다.
SELECT
  'R' || LPAD(DENSE_RANK() OVER (ORDER BY r.user_id)::text, 4, '0') AS respondent,  -- 익명 순번
  q.order_no        AS 문항번호,
  q.question_type   AS 유형,
  q.question_text   AS 문항,
  r.answer          AS 답변,
  r.created_at      AS 응답시각
FROM public.survey_responses r
JOIN public.survey_questions q ON q.id = r.survey_question_id
WHERE r.survey_id = '<SURVEY_ID>'
  -- [검증필터] 검증 통과자만(기본). 전체를 뽑으려면 이 AND 블록을 통째로 주석 처리.
  AND r.user_id IN (SELECT user_id FROM public.survey_reward_claims WHERE survey_id = '<SURVEY_ID>')
ORDER BY respondent, q.order_no;


-- ############################################################################
-- (b) 문항별 집계
-- ############################################################################

-- (b-1) 객관식(단일)·척도 : 보기별 카운트
--       single_choice = 선택 문자열 그대로, scale = "1"~"5" 문자열.
SELECT
  q.order_no                       AS 문항번호,
  q.question_type                  AS 유형,
  q.question_text                  AS 문항,
  r.answer                         AS 보기,
  COUNT(*)                         AS 응답수,
  ROUND(100.0 * COUNT(*)
        / SUM(COUNT(*)) OVER (PARTITION BY q.id), 1) AS 비율_pct
FROM public.survey_responses r
JOIN public.survey_questions q ON q.id = r.survey_question_id
WHERE r.survey_id = '<SURVEY_ID>'
  AND q.question_type IN ('single_choice','scale')
  -- [검증필터] 검증 통과자만(기본). 전체는 아래 AND 를 주석 처리.
  AND r.user_id IN (SELECT user_id FROM public.survey_reward_claims WHERE survey_id = '<SURVEY_ID>')
GROUP BY q.id, q.order_no, q.question_type, q.question_text, r.answer
ORDER BY q.order_no, 응답수 DESC;


-- (b-2) 객관식(복수) : answer(JSON 배열)를 보기 단위로 펼쳐 카운트
--       예: answer = ["배달앱","금융"] → '배달앱' 1, '금융' 1 로 각각 집계.
SELECT
  q.order_no                       AS 문항번호,
  q.question_text                  AS 문항,
  opt                              AS 보기,
  COUNT(*)                         AS 선택수
FROM public.survey_responses r
JOIN public.survey_questions q ON q.id = r.survey_question_id
CROSS JOIN LATERAL jsonb_array_elements_text(r.answer::jsonb) AS opt
WHERE r.survey_id = '<SURVEY_ID>'
  AND q.question_type = 'multi_choice'
  AND r.answer IS NOT NULL AND r.answer <> ''          -- 빈 answer 는 jsonb 캐스팅 제외
  -- [검증필터] 검증 통과자만(기본). 전체는 아래 AND 를 주석 처리.
  AND r.user_id IN (SELECT user_id FROM public.survey_reward_claims WHERE survey_id = '<SURVEY_ID>')
GROUP BY q.id, q.order_no, q.question_text, opt
ORDER BY q.order_no, 선택수 DESC;


-- (b-3) 척도 요약 통계 (평균·최소·최대) — 선택
SELECT
  q.order_no                       AS 문항번호,
  q.question_text                  AS 문항,
  COUNT(*)                         AS 응답수,
  ROUND(AVG(r.answer::numeric), 2) AS 평균,
  MIN(r.answer::numeric)           AS 최소,
  MAX(r.answer::numeric)           AS 최대
FROM public.survey_responses r
JOIN public.survey_questions q ON q.id = r.survey_question_id
WHERE r.survey_id = '<SURVEY_ID>'
  AND q.question_type = 'scale'
  AND r.answer ~ '^[1-5]$'                              -- 숫자 척도만(안전)
  -- [검증필터] 검증 통과자만(기본). 전체는 아래 AND 를 주석 처리.
  AND r.user_id IN (SELECT user_id FROM public.survey_reward_claims WHERE survey_id = '<SURVEY_ID>')
GROUP BY q.id, q.order_no, q.question_text
ORDER BY q.order_no;


-- (b-4) 주관식 : 답변 목록 (익명 순번과 함께)
SELECT
  q.order_no                       AS 문항번호,
  q.question_text                  AS 문항,
  'R' || LPAD(DENSE_RANK() OVER (ORDER BY r.user_id)::text, 4, '0') AS respondent,
  r.answer                         AS 답변
FROM public.survey_responses r
JOIN public.survey_questions q ON q.id = r.survey_question_id
WHERE r.survey_id = '<SURVEY_ID>'
  AND q.question_type = 'text'
  -- [검증필터] 검증 통과자만(기본). 전체는 아래 AND 를 주석 처리.
  AND r.user_id IN (SELECT user_id FROM public.survey_reward_claims WHERE survey_id = '<SURVEY_ID>')
ORDER BY q.order_no, respondent;
