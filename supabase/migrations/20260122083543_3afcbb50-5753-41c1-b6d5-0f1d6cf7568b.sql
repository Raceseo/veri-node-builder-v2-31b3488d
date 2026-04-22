-- Fix the trigger to handle numeric to integer conversion properly
CREATE OR REPLACE FUNCTION public.complete_withdrawal()
RETURNS TRIGGER AS $$
DECLARE
  deduct_amount INTEGER;
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Convert numeric to integer for deduction
    deduct_amount := NEW.amount::INTEGER;
    
    -- Deduct from user's vn_balance
    UPDATE public.profiles
    SET vn_balance = GREATEST(0, vn_balance - deduct_amount),
        updated_at = NOW()
    WHERE id = NEW.user_id
    AND vn_balance >= deduct_amount;
    
    -- Check if update was successful
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient balance for withdrawal completion. User: %, Amount: %', NEW.user_id, deduct_amount;
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
      -deduct_amount,
      '출금 완료 (2인 승인): ' || NEW.bank_name,
      'withdrawal',
      NEW.id,
      'completed'
    );
    
    RAISE NOTICE 'Withdrawal completed. User: %, Amount: %, Bank: %', NEW.user_id, deduct_amount, NEW.bank_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trigger_complete_withdrawal ON public.withdrawals;
CREATE TRIGGER trigger_complete_withdrawal
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.complete_withdrawal();