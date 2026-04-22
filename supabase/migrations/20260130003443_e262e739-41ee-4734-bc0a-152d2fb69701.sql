-- Passkey 저장용 테이블
CREATE TABLE public.user_passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  device_name TEXT,
  transports TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Passkey Challenge 임시 저장 테이블
CREATE TABLE public.passkey_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  challenge TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_user_passkeys_user_id ON public.user_passkeys(user_id);
CREATE INDEX idx_user_passkeys_credential_id ON public.user_passkeys(credential_id);
CREATE INDEX idx_passkey_challenges_challenge ON public.passkey_challenges(challenge);
CREATE INDEX idx_passkey_challenges_expires_at ON public.passkey_challenges(expires_at);

-- RLS 활성화
ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;

-- user_passkeys RLS 정책
CREATE POLICY "Users can view own passkeys"
ON public.user_passkeys FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own passkeys"
ON public.user_passkeys FOR DELETE
USING (auth.uid() = user_id);

-- Edge function이 서비스 역할로 삽입/업데이트하므로 authenticated 사용자 정책 불필요
-- 대신 service_role로만 INSERT/UPDATE 가능하게 설정

CREATE POLICY "Service role can manage passkeys"
ON public.user_passkeys FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- passkey_challenges RLS 정책 (Edge function에서 service_role로 관리)
CREATE POLICY "Service role can manage challenges"
ON public.passkey_challenges FOR ALL
USING (true)
WITH CHECK (true);

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

-- 새 challenge 삽입 시 만료된 것들 정리
CREATE TRIGGER trigger_cleanup_expired_challenges
AFTER INSERT ON public.passkey_challenges
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_challenges();