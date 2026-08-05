-- ============================================================================
-- B-29 1단계 — 인증 보상 원자적 적립 RPC (grant_verification_reward)
-- 대상: 서울 prod (okeeihfmagfogvuxzszb, ap-northeast-2)
-- 실행: MCP 접근 불가 → Ray 가 Supabase SQL Editor 에서 직접 실행
-- 작성: Claude Code (2026-08-05)
--
-- 배경:
--  · 프론트(AntiCherryPickerSurveyView.updateProfileVerification)가 authenticated 로
--    verification_history INSERT 를 시도하는데, 서울 실물 정책이 service_role 전용이라
--    **테이블 전체 0행** — 넉 달간 인증 기록이 하나도 남지 않았다(B-29).
--  · VN 보상도 미지급 상태였다(vn_earned=0, reward_pending=true). 보안 규칙 #4 와
--    protect_vn_balance 트리거 때문에 프론트에서 vn_balance 를 못 고치기 때문.
--  · 신뢰도·기록·잔액·장부는 한 몸 — 하나라도 실패하면 전체 롤백되게 한 트랜잭션으로 묶는다.
--
-- Ray 확정 사항 (2026-08-04):
--  · 1항 verification_reward_claims 신설, UNIQUE(user_id) 로 이중 지급 DB 차단
--  · 2항 **보상 100 VN 단일 · trust_score +5 단일.** isFullyLinked 분기(500/+15)는
--        넣지 않는다 — mydata_connections 에 행을 만들 실제 경로가 3단계까지 없어
--        **도달 불가 분기**다.
--  · 3항 소급 지급 없음 — 기존 인증자(is_verified=true)는 already_verified 로 차단된다.
--
-- 보안 규칙(CLAUDE.md) 준수:
--  · #3 SECURITY DEFINER 함수 → REVOKE EXECUTE FROM PUBLIC/anon/authenticated 후
--       service_role 에만 GRANT (프론트 직접 호출 금지 = 규칙 #4).
--  · protect_vn_balance 트리거: RPC 는 SECURITY DEFINER(소유자 postgres)로 실행되어
--       vn_balance UPDATE 시 current_user=postgres → 트리거 통과.
--
-- 참조 구현: 20260727110000_create_grant_survey_reward_rpc.sql
-- ============================================================================

CREATE OR REPLACE FUNCTION public.grant_verification_reward(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_reward   CONSTANT integer := 100;   -- Ray 확정 2항: 100 VN 단일
  c_score    CONSTANT integer := 5;     -- Ray 확정 2항: +5 단일
  v_verified boolean;
  v_trust_b  integer;
  v_trust_a  integer;
  v_before   integer;
  v_after    integer;
  v_claim    uuid;
  v_tx       uuid;
BEGIN
  -- 1) 프로필 행 잠금 + 현재 상태 확보 (동시 요청 직렬화)
  SELECT COALESCE(is_verified, false), COALESCE(trust_score, 0), COALESCE(vn_balance, 0)
    INTO v_verified, v_trust_b, v_before
    FROM public.profiles
   WHERE id = p_user_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'profile_not_found');
  END IF;

  -- 2) 중복 차단 ① — 이미 인증된 사용자는 재지급하지 않는다 (확정 3항: 소급 없음)
  IF v_verified THEN
    RETURN jsonb_build_object('ok', false, 'code', 'already_verified');
  END IF;

  -- 3) 중복 차단 ② — UNIQUE(user_id) 기반 원자적 게이트.
  --    이미 적립돼 있으면 아무 행도 안 들어가고 FOUND=false → already_claimed 반환.
  INSERT INTO public.verification_reward_claims (user_id, reward_vn)
  VALUES (p_user_id, c_reward)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_claim;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'already_claimed');
  END IF;

  -- 4) 인증 확정 + 신뢰도 +5 (상한 100)
  v_trust_a := LEAST(v_trust_b + c_score, 100);
  UPDATE public.profiles
     SET is_verified = true,
         trust_score = v_trust_a,
         updated_at  = now()
   WHERE id = p_user_id;

  -- 5) 인증 기록 — B-29 의 본체. service_role 전용 정책이라 여기(DEFINER)에서만 들어간다.
  INSERT INTO public.verification_history
    (user_id, verification_type, trust_score_before, trust_score_after,
     score_change, vn_earned, result)
  VALUES
    (p_user_id, 'identity_verification', v_trust_b, v_trust_a,
     c_score, c_reward,
     jsonb_build_object(
       'type', 'first_verification',
       'passed', true,
       'reward_pending', false,
       'claim_id', v_claim
     ));

  -- 6) 잔액 적립 (1 에서 이미 행을 잠갔다)
  v_after := v_before + c_reward;
  UPDATE public.profiles
     SET vn_balance = v_after,
         updated_at = now()
   WHERE id = p_user_id;

  -- 7) 장부 기재 — 실패하면 예외가 함수 밖으로 전파되어 3~6 을 포함해 전체 롤백된다.
  INSERT INTO public.transactions
    (user_id, type, amount, balance_before, balance_after,
     description, reference_type, reference_id)
  VALUES
    (p_user_id, 'verification_reward', c_reward, v_before, v_after,
     '본인 인증 완료 보상', 'verification', v_claim)
  RETURNING id INTO v_tx;

  UPDATE public.verification_reward_claims
     SET transaction_id = v_tx
   WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'reward_vn', c_reward,
    'new_balance', v_after,
    'score_change', c_score,
    'new_trust_score', v_trust_a
  );
END;
$$;

-- 보안 규칙 #3: 프론트(anon/authenticated) 직접 호출 차단, service_role(Edge Function)만 허용
REVOKE EXECUTE ON FUNCTION public.grant_verification_reward(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.grant_verification_reward(uuid) TO service_role;
