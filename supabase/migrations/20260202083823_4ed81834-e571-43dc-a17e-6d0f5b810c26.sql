-- payment_orders 테이블의 order_type 체크 제약조건 수정
-- 'subscription' 값을 허용하도록 업데이트

-- 기존 제약조건 삭제
ALTER TABLE public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_order_type_check;

-- 새 제약조건 추가 (one_time, subscription 모두 허용)
ALTER TABLE public.payment_orders ADD CONSTRAINT payment_orders_order_type_check 
CHECK (order_type IN ('one_time', 'subscription', 'data_purchase', 'vn_charge', 'membership'));