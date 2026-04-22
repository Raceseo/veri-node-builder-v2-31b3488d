
-- =============================================
-- 1. submissions 테이블 (데이터 제출 - 불변)
-- =============================================
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인 또는 관리자
CREATE POLICY "Owner or admin can view submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- INSERT: 본인만
CREATE POLICY "Users can insert own submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE/DELETE 정책 없음 = 불변성 보장

-- =============================================
-- 2. approval_workflow 테이블 (범용 2인 승인)
-- =============================================
CREATE TABLE public.approval_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  first_approver_id UUID REFERENCES auth.users(id),
  second_approver_id UUID REFERENCES auth.users(id),
  first_approved_at TIMESTAMPTZ,
  second_approved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.approval_workflow ENABLE ROW LEVEL SECURITY;

-- SELECT: 요청자, 승인자, 또는 관리자
CREATE POLICY "Requester or approvers or admin can view workflows"
  ON public.approval_workflow FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requester_id
    OR auth.uid() = first_approver_id
    OR auth.uid() = second_approver_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- INSERT: 서비스 역할만 (authenticated 사용자 직접 삽입 불가)
-- 서비스 역할 키로만 삽입 가능하도록 정책 없음

-- UPDATE: 관리자만 + 자기승인 방지
CREATE POLICY "Admin can update workflow except self-approval"
  ON public.approval_workflow FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND auth.uid() != requester_id
  );

-- DELETE 정책 없음

-- =============================================
-- 3. reward_ledger 테이블 (불변 포인트 원장)
-- =============================================
CREATE TABLE public.reward_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  approval_workflow_id UUID REFERENCES public.approval_workflow(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_ledger ENABLE ROW LEVEL SECURITY;

-- SELECT: 본인만
CREATE POLICY "Users can view own ledger"
  ON public.reward_ledger FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE 정책 없음 = 서비스 역할만 삽입 가능, 수정/삭제 불가

-- =============================================
-- 4. 트리거 함수: 2인 승인 완료 시 자동 포인트 지급
-- =============================================
CREATE OR REPLACE FUNCTION public.process_approved_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reward_amount INTEGER;
  current_balance INTEGER;
  new_balance INTEGER;
  submission_record RECORD;
BEGIN
  -- status가 completed로 변경된 경우에만 실행
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN

    -- 검증 1: 두 승인자가 모두 존재하는지
    IF NEW.first_approver_id IS NULL OR NEW.second_approver_id IS NULL THEN
      RAISE EXCEPTION 'SECURITY: Both approvers must be set before completion';
    END IF;

    -- 검증 2: 동일인 승인 차단
    IF NEW.first_approver_id = NEW.second_approver_id THEN
      RAISE EXCEPTION 'SECURITY: First and second approvers must be different';
    END IF;

    -- 검증 3: 요청자가 승인자가 아닌지
    IF NEW.requester_id = NEW.first_approver_id OR NEW.requester_id = NEW.second_approver_id THEN
      RAISE EXCEPTION 'SECURITY: Requester cannot be an approver';
    END IF;

    -- submission 타입인 경우에만 보상 처리
    IF NEW.reference_type = 'submission' THEN
      -- submissions에서 관련 정보 조회
      SELECT * INTO submission_record
      FROM public.submissions
      WHERE id = NEW.reference_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced submission not found: %', NEW.reference_id;
      END IF;

      -- 보상 금액 결정 (submission_type에 따라)
      CASE submission_record.submission_type
        WHEN 'survey' THEN reward_amount := 100;
        WHEN 'document' THEN reward_amount := 200;
        WHEN 'data_upload' THEN reward_amount := 300;
        ELSE reward_amount := 50;
      END CASE;

      -- 현재 잔액 조회
      SELECT COALESCE(vn_balance, 0) INTO current_balance
      FROM public.profiles
      WHERE id = NEW.requester_id;

      new_balance := current_balance + reward_amount;

      -- reward_ledger에 불변 기록 삽입
      INSERT INTO public.reward_ledger (
        user_id, amount, balance_after, source_type,
        source_id, approval_workflow_id, description
      ) VALUES (
        NEW.requester_id, reward_amount, new_balance, 'survey_reward',
        NEW.reference_id, NEW.id,
        submission_record.title || ' 승인 완료 보상'
      );

      -- profiles.vn_balance 업데이트
      UPDATE public.profiles
      SET vn_balance = new_balance, updated_at = now()
      WHERE id = NEW.requester_id;

      -- 알림 삽입
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        NEW.requester_id,
        'reward',
        '🎉 보상 지급 완료!',
        '관리자 2인 승인이 완료되어 ' || reward_amount || ' VN이 지급되었습니다.',
        jsonb_build_object(
          'workflow_id', NEW.id,
          'amount', reward_amount,
          'balance_after', new_balance
        )
      );

      -- submissions 상태 업데이트
      UPDATE public.submissions
      SET status = 'approved', reviewed_at = now()
      WHERE id = NEW.reference_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 트리거 생성
CREATE TRIGGER trigger_process_approved_reward
  BEFORE UPDATE ON public.approval_workflow
  FOR EACH ROW
  EXECUTE FUNCTION public.process_approved_reward();
