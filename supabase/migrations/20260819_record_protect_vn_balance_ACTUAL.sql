-- ============================================================================
-- 🔴 실행 금지 · 기록 전용 · 2026-08-19 실물 대조본
--
--   이 파일은 서울 prod(okeeihfmagfogvuxzszb, ap-northeast-2)의
--   public.protect_vn_balance() 실물 정의를 pg_get_functiondef 로 떠서
--   **한 글자도 고치지 않고** 기록한 것이다. repo 이력 보존용이며 재실행하지 않는다.
--
--   갱신 배경:
--     기존 기록본(20260726120100_record_protect_vn_balance_trigger.sql)은
--     SECURITY INVOKER + current_user 검사로 적혀 있었으나, 2026-08-19 실물
--     대조 결과 **실물은 SECURITY DEFINER + auth.jwt() 검사**로 서로 달랐다.
--     구 기록본은 요약을 재현한 것이라 실물과 어긋났고, 이 파일이 정본 기록이다.
--
--   판정이 정상 작동하는 이유:
--     DEFINER 함수라 current_user 는 소유자(postgres)로 고정되지만, 이 구현은
--     current_user 가 아니라 (auth.jwt() ->> 'role') 로 판정한다. auth.jwt() 는
--     DEFINER 영향을 받지 않고 **원래 요청자의 JWT** 를 반영하므로, 프론트
--     (role=authenticated)의 vn_balance 직접 UPDATE 는 그대로 차단된다.
--     service_role(Edge Function)은 role 이 authenticated 가 아니므로 통과한다.
--
--   ⚠️ search_path 관련:
--     실물을 뜬 2026-08-19 시점 proconfig 는 **null**(search_path 미설정)이었다.
--     그 직후 `ALTER FUNCTION public.protect_vn_balance() SET search_path = public`
--     을 적용해 **현재 proconfig 는 ["search_path=public"]** 이다.
--     아래 본문에는 그 시점 원문이라 SET search_path 절이 없다 — 이는 의도된 기록이며,
--     현재 실물에는 search_path=public 이 설정돼 있다는 사실을 여기 명기한다.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.protect_vn_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if new.vn_balance is distinct from old.vn_balance
     and (auth.jwt() ->> 'role') = 'authenticated' then
    raise exception 'vn_balance는 서버(Edge Function)에서만 변경할 수 있습니다';
  end if;
  return new;
end;
$function$
