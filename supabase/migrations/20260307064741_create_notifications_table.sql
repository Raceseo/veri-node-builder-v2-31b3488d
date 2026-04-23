-- ⚙️ AUTO-CAPTURED FROM REMOTE (2026-04-23)
-- Lovable이 UI로 remote에 적용했으나 repo에 commit 안 된 마이그레이션을
-- supabase_migrations.schema_migrations 테이블에서 복원한 것.
-- Original version: 20260307064741

-- ✅ 알림 테이블 생성
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'data_sold',        -- 내 데이터 판매됨
    'reward_received',  -- 보상 지급
    'withdrawal_approved', -- 출금 승인
    'withdrawal_rejected', -- 출금 거절
    'trust_score_up',   -- 신뢰도 상승
    'survey_available', -- 새 설문 등록
    'system'            -- 시스템 공지
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ✅ RLS 활성화
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ✅ RLS 정책: 본인 알림만 조회 가능
CREATE POLICY "users_read_own_notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- ✅ RLS 정책: 본인 알림만 읽음 처리 가능
CREATE POLICY "users_update_own_notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ✅ 시스템(서버)이 알림 생성 가능
CREATE POLICY "service_insert_notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ✅ 인덱스 (조회 성능 향상)
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ✅ 데이터 판매 시 자동 알림 트리거 함수
CREATE OR REPLACE FUNCTION notify_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'sale' AND NEW.amount > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'data_sold',
      '데이터가 판매됐어요! 🎉',
      '내 데이터가 판매되어 ' || NEW.amount || ' VN이 지급됐습니다.',
      jsonb_build_object('amount', NEW.amount, 'transaction_id', NEW.id)
    );
  ELSIF NEW.type = 'verification_reward' AND NEW.amount > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'reward_received',
      '보상이 지급됐어요! 💰',
      NEW.description || ' +' || NEW.amount || ' VN',
      jsonb_build_object('amount', NEW.amount, 'transaction_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ✅ 트리거 연결 (transactions 테이블에 새 행 추가될 때)
CREATE OR REPLACE TRIGGER on_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION notify_on_transaction();

-- ✅ 출금 승인 시 자동 알림 트리거 함수
CREATE OR REPLACE FUNCTION notify_on_withdrawal_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'withdrawal_approved',
      '출금이 승인됐어요! ✅',
      NEW.amount || ' VN 출금 신청이 승인되어 처리 중입니다.',
      jsonb_build_object('amount', NEW.amount, 'withdrawal_id', NEW.id)
    );
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'withdrawal_rejected',
      '출금이 거절됐어요 ⚠️',
      '출금 신청이 거절됐습니다. 고객센터에 문의해주세요.',
      jsonb_build_object('amount', NEW.amount, 'withdrawal_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ✅ 트리거 연결 (withdrawal_requests 상태 변경 시)
CREATE OR REPLACE TRIGGER on_withdrawal_status_changed
  AFTER UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_withdrawal_update();
