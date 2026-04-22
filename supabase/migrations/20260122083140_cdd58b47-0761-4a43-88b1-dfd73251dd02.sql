-- Add approval tracking columns to withdrawals table
ALTER TABLE public.withdrawals 
ADD COLUMN IF NOT EXISTS first_approver_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS second_approver_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS first_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS second_approved_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster approval queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_approvers ON public.withdrawals(first_approver_id, second_approver_id);

-- Update function to deduct balance on completion
CREATE OR REPLACE FUNCTION public.complete_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Deduct from user's vn_balance
    UPDATE public.profiles
    SET vn_balance = vn_balance - NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.user_id
    AND vn_balance >= NEW.amount;
    
    -- Check if update was successful
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient balance for withdrawal completion';
    END IF;
    
    -- Set completion timestamp
    NEW.completed_at = NOW();
    
    -- Log the transaction
    INSERT INTO public.transactions (
      user_id,
      type,
      amount,
      description,
      reference_type,
      reference_id,
      status
    ) VALUES (
      NEW.user_id,
      'withdrawal',
      -NEW.amount,
      '출금 완료 (2인 승인)',
      'withdrawal',
      NEW.id,
      'completed'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for withdrawal completion
DROP TRIGGER IF EXISTS trigger_complete_withdrawal ON public.withdrawals;
CREATE TRIGGER trigger_complete_withdrawal
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.complete_withdrawal();