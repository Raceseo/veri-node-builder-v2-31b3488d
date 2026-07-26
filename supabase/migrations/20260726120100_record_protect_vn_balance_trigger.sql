-- ============================================================================
-- 기록용(RECORD-ONLY) — profiles.vn_balance 직접 변경 방지 트리거
--
--   ⚠️ 2026-07-26 SQL Editor로 서울 prod(okeeihfmagfogvuxzszb)에 이미 적용됨.
--      이 파일은 repo 이력 보존을 위한 "기록"이며, 다시 실행할 필요 없음.
--
--   ⚠️ 주의: 아래 SQL은 적용 의도를 재현한 기록본입니다. Claude Code가
--      실제 적용된 원문을 직접 확보하지 못했으므로, 문구가 SQL Editor에서
--      실행한 실제 정의와 다를 수 있습니다. Ray가 대조 확인 요망.
--      (확인: SQL Editor에서
--         SELECT prosrc FROM pg_proc WHERE proname = 'protect_vn_balance';
--       로 실제 본문 비교)
--
--   목적: 보안 규칙 #4 — VN잔액 변경은 Edge Function(service_role) 경유만 허용.
--         프론트(anon/authenticated)의 profiles.vn_balance 직접 UPDATE를 DB에서 차단.
-- ============================================================================

-- ─── 가드 함수 ──────────────────────────────────────────────────────────────
-- SECURITY INVOKER(기본)로 두어 트리거 실행 시 current_user가 호출 역할을 반영하게 함.
-- (SECURITY DEFINER로 두면 current_user가 함수 소유자가 되어 역할 검사가 무의미해짐)
CREATE OR REPLACE FUNCTION public.protect_vn_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- vn_balance가 실제로 바뀐 경우에만 검사
  IF NEW.vn_balance IS DISTINCT FROM OLD.vn_balance THEN
    -- service_role(Edge Function) 및 관리자/마이그레이션 역할만 허용
    IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'vn_balance는 Edge Function(service_role)을 통해서만 변경할 수 있습니다 (현재 역할: %)', current_user
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ─── 트리거 연결 ────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_protect_vn_balance ON public.profiles;
CREATE TRIGGER trg_protect_vn_balance
  BEFORE UPDATE OF vn_balance ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_vn_balance();
