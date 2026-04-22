-- 개인정보 설정 테이블 생성
CREATE TABLE public.privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  anonymization_level TEXT NOT NULL DEFAULT 'full',
  allowed_uses TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- RLS 활성화
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own privacy settings"
  ON public.privacy_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings"
  ON public.privacy_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
  ON public.privacy_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own privacy settings"
  ON public.privacy_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- 업데이트 트리거
CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();