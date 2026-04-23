-- =====================================================
-- Catch-up migration: profiles 스키마 + user_type 제약을 앱 코드와 일치시킴
-- =====================================================
-- 배경:
--   /qa 후속 QA에서 신규 회원이 온보딩을 완료할 수 없음을 발견.
--   - Index.tsx:62 는 profiles.user_type 을 'individual'/'enterprise' 로 UPDATE 시도하지만
--     profiles_user_type_check 는 ['seller','buyer','admin'] 만 허용 → 100% 실패.
--   - useRealtimeProfile 은 profiles 에서 22개 컬럼을 SELECT 하지만 prod 에는 10개만 존재 → 400.
--   - usePasskey 는 user_passkeys 테이블을 조회하지만 테이블이 존재하지 않음 → PGRST205.
--
-- 이 마이그레이션은 전부 idempotent (IF NOT EXISTS / DROP ... IF EXISTS + CREATE) 이며
-- 기존 데이터와 호환됩니다 ('seller' 등 기존 값 유지됨).
-- =====================================================

-- 1. profiles: 코드가 기대하는 누락 컬럼 12개 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS data_categories TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_last_updated TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS age_group TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS security_level INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.profiles.security_level IS 'Security level: 0=Unverified, 1=Basic, 2+=Verified';
COMMENT ON COLUMN public.profiles.locked_balance IS 'Balance locked for security review (cannot be withdrawn)';

-- 2. user_type CHECK 제약 확장
--    기존: ['seller','buyer','admin']
--    신규: 기존 + ['individual','enterprise']  (이중 호환 - 기존 데이터 유지)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_type_check
  CHECK (user_type = ANY (ARRAY['individual'::text, 'enterprise'::text, 'seller'::text, 'buyer'::text, 'admin'::text]));

-- 3. handle_new_user 트리거: 기본 user_type 을 'individual' 로 변경
--    + auth metadata 에서 display_name·user_type 을 읽어 자동 세팅 (Auth.tsx 의 signUp 이 보내는 값)
--    + email 을 auth.users.email 에서 복사
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
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
  RETURN NEW;
END;
$function$;

-- 4. user_passkeys + passkey_challenges 테이블 생성 (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.user_passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_name TEXT,
  transports TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.passkey_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  challenge TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_passkeys_user_id ON public.user_passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passkeys_credential_id ON public.user_passkeys(credential_id);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_challenge ON public.passkey_challenges(challenge);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires_at ON public.passkey_challenges(expires_at);

ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;

-- user_passkeys RLS (drop-if-exists 후 create — idempotent)
DROP POLICY IF EXISTS "Users can view own passkeys" ON public.user_passkeys;
CREATE POLICY "Users can view own passkeys"
  ON public.user_passkeys FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own passkeys" ON public.user_passkeys;
CREATE POLICY "Users can delete own passkeys"
  ON public.user_passkeys FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage passkeys" ON public.user_passkeys;
CREATE POLICY "Service role can manage passkeys"
  ON public.user_passkeys FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage challenges" ON public.passkey_challenges;
CREATE POLICY "Service role can manage challenges"
  ON public.passkey_challenges FOR ALL
  USING (true) WITH CHECK (true);

-- 만료된 challenge 자동 정리 함수
CREATE OR REPLACE FUNCTION public.cleanup_expired_challenges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.passkey_challenges
  WHERE expires_at < now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_cleanup_expired_challenges ON public.passkey_challenges;
CREATE TRIGGER trigger_cleanup_expired_challenges
  AFTER INSERT ON public.passkey_challenges
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_expired_challenges();
