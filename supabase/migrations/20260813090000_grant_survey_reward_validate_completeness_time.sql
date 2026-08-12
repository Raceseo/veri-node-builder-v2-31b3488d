-- ============================================================================
-- §10-3 검증 1층 (커밋1) — grant_survey_reward 에 완성도·최소시간 검사 추가
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray 가 Supabase SQL Editor 에서 직접 실행
-- 작성: Claude Code (2026-08-13)
--
-- 배경:
--  · 기존 grant_survey_reward 는 "응답 행이 1건이라도 있으면"(count>0) 보상을 전액
--    지급했다. 12문항 중 1개만 답해도 전액이 나갔다.
--  · 검증 1층 두 가지를 RPC 안(잔액 변경 직전)에 넣어, 실패 시 응답(survey_responses)은
--    그대로 두고 보상만 거부한다. 검사가 RPC 안에 있어야 원자성과 service_role 경유
--    (규칙 #4) 를 함께 지킨다.
--
-- 검사:
--  a. 완성도  — 이 설문의 문항을 실제로 덮은 distinct survey_question_id 수가
--               설문 전체 문항 수와 같은가 (누락 1개도 거부).
--               survey_questions 조인으로 "이 설문에 속한" 응답만 세어
--               중복행·타 설문 문항 주입으로 개수를 부풀리는 우회를 막는다.
--  c. 최소시간 — 이 설문 응답의 time_spent(ms) 합계가 30000ms(30초) 이상인가.
--               time_spent 는 프론트에서 Date.now() 차이(ms)로 저장됨(2026-08-13 확정).
--               하한 30초 근거: 학술(어절 300ms → 28.2k)·실측(중앙값 1/3 → 29.2k) 수렴.
--
-- 실패 코드(프론트/Edge 메시지 매핑용):
--  · incomplete_survey — 완성도 미달(문항 누락, 또는 문항 0개인 오설정 설문)
--  · too_fast          — 최소시간 미달
--  (기존 no_response 은 완성도 검사에 포섭되나, Edge 매핑 호환을 위해 코드값은 유지)
--
-- 보안 규칙(CLAUDE.md) 준수:
--  · #3 SECURITY DEFINER → REVOKE ... FROM PUBLIC/anon/authenticated 후 service_role 만 GRANT.
--  · 기존 마이그레이션 수정 금지 → 새 파일에서 CREATE OR REPLACE 로 재정의.
--  · 스키마 변경 없음(컬럼 추가 없음). 함정(b) correct_answer 는 커밋2에서 별도 처리.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.grant_survey_reward(p_survey_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward    integer;
  v_status    text;
  v_total     integer;   -- 설문 전체 문항 수
  v_answered  integer;   -- 이 설문에 속한, 응답이 실재하는 distinct 문항 수
  v_time      bigint;    -- time_spent(ms) 합계
  v_before    integer;
  v_after     integer;
  v_tx        uuid;
  c_min_time  constant bigint := 30000;  -- 최소 응답시간 하한(ms) = 30초 (Ray 확정 2026-08-13)
BEGIN
  -- 1) 설문 확인 + 보상액
  SELECT reward_vn, status INTO v_reward, v_status FROM public.surveys WHERE id = p_survey_id;
  IF NOT FOUND                THEN RETURN jsonb_build_object('ok', false, 'code', 'survey_not_found');  END IF;
  IF v_status <> 'active'      THEN RETURN jsonb_build_object('ok', false, 'code', 'survey_not_active'); END IF;
  IF COALESCE(v_reward,0) <= 0 THEN RETURN jsonb_build_object('ok', false, 'code', 'no_reward');        END IF;

  -- 2a) 완성도 — 전 문항 필수. 누락 1개도 거부.
  --     설문 전체 문항 수(함정 포함)와, 이 설문 문항을 실제로 덮은 distinct 응답 문항 수를 비교.
  SELECT count(*) INTO v_total
    FROM public.survey_questions
   WHERE survey_id = p_survey_id;

  SELECT count(DISTINCT r.survey_question_id) INTO v_answered
    FROM public.survey_responses r
    JOIN public.survey_questions q
      ON q.id = r.survey_question_id
     AND q.survey_id = p_survey_id           -- 이 설문에 속한 문항만 인정(타 설문 문항 주입 차단)
   WHERE r.survey_id = p_survey_id
     AND r.user_id   = p_user_id;

  -- 문항 0개(오설정)거나 덮지 못한 문항이 하나라도 있으면 거부.
  IF v_total = 0 OR v_answered < v_total THEN
    RETURN jsonb_build_object('ok', false, 'code', 'incomplete_survey');
  END IF;

  -- 2c) 최소시간 — time_spent(ms) 합계가 하한 미만이면 거부.
  SELECT COALESCE(sum(time_spent), 0) INTO v_time
    FROM public.survey_responses
   WHERE survey_id = p_survey_id
     AND user_id   = p_user_id;

  IF v_time < c_min_time THEN
    RETURN jsonb_build_object('ok', false, 'code', 'too_fast');
  END IF;

  -- 3) 중복 적립 방지 — (survey_id, user_id) ON CONFLICT. 이미 적립됐으면 already_claimed.
  INSERT INTO public.survey_reward_claims (survey_id, user_id, reward_vn)
  VALUES (p_survey_id, p_user_id, v_reward)
  ON CONFLICT (survey_id, user_id) DO NOTHING;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'already_claimed');
  END IF;

  -- 4) 잔액 적립 (행 잠금으로 동시성 보호)
  SELECT COALESCE(vn_balance, 0) INTO v_before FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  v_after := v_before + v_reward;
  UPDATE public.profiles SET vn_balance = v_after, updated_at = now() WHERE id = p_user_id;

  -- 5) 장부 기재 — 실패하면 예외 전파 → 3·4 포함 전체 롤백
  INSERT INTO public.transactions
    (user_id, type, amount, balance_before, balance_after, description, reference_type, reference_id)
  VALUES
    (p_user_id, 'survey_reward', v_reward, v_before, v_after, '설문 응답 완료 보상', 'survey', p_survey_id)
  RETURNING id INTO v_tx;

  UPDATE public.survey_reward_claims SET transaction_id = v_tx
   WHERE survey_id = p_survey_id AND user_id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'reward_vn', v_reward, 'new_balance', v_after);
END;
$$;

-- 보안 규칙 #3: 프론트(anon/authenticated) 직접 호출 차단, service_role(Edge Function)만 허용.
-- (CREATE OR REPLACE 는 기존 권한을 보존하나, 자기완결성을 위해 재선언한다.)
REVOKE EXECUTE ON FUNCTION public.grant_survey_reward(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.grant_survey_reward(uuid, uuid) TO service_role;
