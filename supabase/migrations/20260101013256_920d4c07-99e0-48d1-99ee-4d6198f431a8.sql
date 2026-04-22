-- profiles 테이블에 온보딩 완료 여부 필드 추가
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 기존 사용자들은 온보딩 완료로 처리 (이미 가입한 사용자들)
UPDATE public.profiles SET onboarding_completed = true WHERE onboarding_completed IS NULL OR onboarding_completed = false;