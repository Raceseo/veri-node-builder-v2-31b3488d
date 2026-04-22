-- transactions 테이블에 출금 관리용 컬럼 추가
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_transactions_user_status 
ON public.transactions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_transactions_is_locked 
ON public.transactions(is_locked) 
WHERE is_locked = true;