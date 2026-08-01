-- ============================================================================
-- 구간J-1-b — handle_new_user 동의 게이트 (사후 기록용 RECORD-ONLY)
--
-- ⚠️ 2026-08-01 Ray가 Supabase SQL Editor로 서울 prod(okeeihfmagfogvuxzszb)에
--    이미 직접 적용함. 이 파일은 저장소 사후 기록이며 다시 실행할 필요 없음.
--
-- 동작:
--  - 가입 시 raw_user_meta_data->>'consent_version' 이 없으면 RAISE EXCEPTION 으로
--    auth.users INSERT 를 롤백 → "동의 없이는 계정 없음"(fail-closed).
--  - 있으면 profiles + data_usage_consents(consent_type='data_usage') 를 함께 기록.
--  - profiles INSERT 는 저장소 원본(20260422 catch_up)과 동일. agreed_at 은 서버 now().
--  - 트리거 on_auth_user_created 는 이름으로 바인딩되어 함수 교체만으로 그대로 재사용됨.
--
-- ⚠️ 운영 주의: 이 트리거가 라이브인 동안 가입 클라이언트는 반드시 consent_version 을
--    보내야 함(Auth.tsx / useAuth signUp — 커밋 5fd13ae). consent_version 미전송
--    배포본이 라이브면 신규 가입이 전면 실패한다. (프론트 배포 → 트리거 적용 순서 준수)
--    또한 Supabase Dashboard "Add user" 등 앱 밖 계정 생성도 동의 없으면 실패한다.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_consent_version text;
BEGIN
  -- J-1-b (2026-08-01): 동의 없이는 계정을 만들지 않는다.
  v_consent_version := NULLIF(trim(NEW.raw_user_meta_data->>'consent_version'), '');

  IF v_consent_version IS NULL THEN
    RAISE EXCEPTION '개인정보 수집·이용 동의 없이 계정을 생성할 수 없습니다 (consent_version 없음)';
  END IF;

  -- 아래 profiles INSERT는 기존 원본과 한 글자도 다르지 않음
  INSERT INTO public.profiles (id, user_type, is_verified, trust_score, vn_balance, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'individual'),
    false,
    0,
    0,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- 동의 기록: 시각은 서버가 찍는다 (클라이언트 값 신뢰 안 함)
  INSERT INTO public.data_usage_consents (
    user_id, consent_type, is_agreed, consent_version, agreed_at, ip_address, user_agent
  )
  VALUES (
    NEW.id, 'data_usage', true, v_consent_version, now(), NULL, NULL
  );

  RETURN NEW;
END;
$function$;
