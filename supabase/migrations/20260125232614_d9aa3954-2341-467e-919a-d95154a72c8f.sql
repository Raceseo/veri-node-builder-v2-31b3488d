-- transactions 테이블에 누락된 컬럼 추가
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS bank_info jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bonus_amount integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS security_metadata jsonb DEFAULT NULL;