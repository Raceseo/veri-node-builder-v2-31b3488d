
-- 1. Add user_type column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'individual';

-- 2. Update handle_new_user trigger to include user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'individual')
  );
  RETURN NEW;
END;
$function$;
