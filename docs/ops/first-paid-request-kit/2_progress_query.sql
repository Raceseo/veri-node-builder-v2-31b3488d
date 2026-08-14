-- ============================================================================
-- [2] 진행률 쿼리  (첫 유료 의뢰 대응 키트)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)  /  실행: Ray, SQL Editor
-- ----------------------------------------------------------------------------
-- 언제 쓰나: active 설문 진행 중, "목표 대비 검증 통과 응답이 몇 건인지" 수시로 확인할 때.
--
-- 유효 응답의 정의(근거: grant_survey_reward RPC):
--   완성도(전 문항 응답) + 최소시간(time_spent 합계 ≥ 30초) 을 통과한 응답자만
--   survey_reward_claims 에 1행 적립된다. 따라서
--     "검증 통과 유효 응답 수 = survey_reward_claims 행 수" 이다.
--   (surveys.response_count 컬럼은 자동 증가되지 않으므로 신뢰하지 않고, 원장에서 직접 센다.)
-- ============================================================================

-- ── 메인: 목표 대비 유효 응답 + 최근 응답 시각 ──────────────────────────────
--    <SURVEY_ID> 를 대상 설문 id 로 교체. (id 를 모르면 아래 '제목으로 찾기' 먼저)
SELECT
  s.title                                                          AS 설문,
  s.status                                                         AS 상태,
  s.target_responses                                               AS 목표응답수,
  COUNT(DISTINCT c.user_id)                                        AS 유효응답수_검증통과,
  GREATEST(s.target_responses - COUNT(DISTINCT c.user_id), 0)      AS 남은수,
  ROUND(100.0 * COUNT(DISTINCT c.user_id)
        / NULLIF(s.target_responses, 0), 1)                        AS 달성률_pct,
  MAX(c.created_at)                                                AS 최근_유효응답_적립시각,
  -- 참고: 응답을 "시작"했으나 검증 미통과(미완성/너무빠름) 포함한 넓은 지표
  (SELECT COUNT(DISTINCT r.user_id)
     FROM public.survey_responses r WHERE r.survey_id = s.id)      AS 응답시작_인원_참고,
  (SELECT MAX(r.created_at)
     FROM public.survey_responses r WHERE r.survey_id = s.id)      AS 최근_응답행_시각_참고
FROM public.surveys s
LEFT JOIN public.survey_reward_claims c ON c.survey_id = s.id
WHERE s.id = '<SURVEY_ID>'
GROUP BY s.id, s.title, s.status, s.target_responses;


-- ── 보조: 제목으로 survey_id 찾기 (id 를 모를 때) ───────────────────────────
-- SELECT id, title, status, target_responses, created_at
-- FROM public.surveys
-- WHERE title ILIKE $$%설문 제목 일부%$$
-- ORDER BY created_at DESC;


-- ── 보조: 최근 유입 추세 (일자별 유효 응답 적립 수) ─────────────────────────
-- SELECT (created_at AT TIME ZONE 'Asia/Seoul')::date AS 일자_KST,
--        COUNT(*) AS 당일_유효응답
-- FROM public.survey_reward_claims
-- WHERE survey_id = '<SURVEY_ID>'
-- GROUP BY 1 ORDER BY 1;
