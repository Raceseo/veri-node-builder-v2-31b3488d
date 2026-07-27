-- ============================================================================
-- A공사 구간④ — 설문 보상 원자적 적립 RPC (grant_survey_reward)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray 가 Supabase SQL Editor 에서 직접 실행
-- 작성: Claude Code (2026-07-27)
--
-- 배경:
--  · 기존 claim-survey-reward Edge Function 은 잔액 update 와 transactions insert 가
--    별개 쿼리라 원자성이 없었고, transactions insert 실패를 삼켜 "잔액만 오르고
--    장부 0행" 상태가 발생함.
--  · 잔액과 장부는 한 몸 — claim/잔액/장부를 한 트랜잭션(RPC)으로 묶어 하나라도
--    실패하면 전체 롤백되게 한다. 실패 원인은 RPC 예외로 함수 응답에 노출됨.
--
-- 보안 규칙(CLAUDE.md) 준수:
--  · #3 SECURITY DEFINER 함수 → REVOKE EXECUTE FROM PUBLIC/anon/authenticated 후
--       service_role 에만 GRANT (프론트 직접 호출 금지 = 규칙 #4).
--  · protect_vn_balance 트리거: RPC 는 SECURITY DEFINER(소유자 postgres)로 실행되어
--       vn_balance UPDATE 시 current_user=postgres → 트리거 통과.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.grant_survey_reward(p_survey_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward integer;
  v_status text;
  v_resp   integer;
  v_before integer;
  v_after  integer;
  v_tx     uuid;
BEGIN
  -- 1) 설문 확인 + 보상액
  SELECT reward_vn, status INTO v_reward, v_status FROM public.surveys WHERE id = p_survey_id;
  IF NOT FOUND               THEN RETURN jsonb_build_object('ok', false, 'code', 'survey_not_found');  END IF;
  IF v_status <> 'active'     THEN RETURN jsonb_build_object('ok', false, 'code', 'survey_not_active'); END IF;
  IF COALESCE(v_reward,0) <= 0 THEN RETURN jsonb_build_object('ok', false, 'code', 'no_reward');       END IF;

  -- 2) 응답 실재 검증
  SELECT count(*) INTO v_resp FROM public.survey_responses
   WHERE survey_id = p_survey_id AND user_id = p_user_id;
  IF v_resp = 0 THEN RETURN jsonb_build_object('ok', false, 'code', 'no_response'); END IF;

  -- 3) 중복 적립 방지 — (survey_id, user_id) 컬럼 기반 ON CONFLICT.
  --    이미 적립돼 있으면 아무 행도 안 들어가고 FOUND=false → already_claimed 반환.
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

  -- 5) 장부 기재 — 실패하면 예외가 함수 밖으로 전파되어 3·4 를 포함해 전체 롤백됨
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

-- 보안 규칙 #3: 프론트(anon/authenticated) 직접 호출 차단, service_role(Edge Function)만 허용
REVOKE EXECUTE ON FUNCTION public.grant_survey_reward(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.grant_survey_reward(uuid, uuid) TO service_role;
