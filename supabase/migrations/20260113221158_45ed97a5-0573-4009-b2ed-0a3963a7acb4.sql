-- Remove plaintext validation constraints that conflict with encryption
-- The process-withdrawal edge function validates format BEFORE encryption
-- These constraints would reject encrypted data (base64 strings)

ALTER TABLE public.withdrawals 
  DROP CONSTRAINT IF EXISTS valid_account_number_format;

ALTER TABLE public.withdrawals 
  DROP CONSTRAINT IF EXISTS valid_account_holder_length;

ALTER TABLE public.withdrawals 
  DROP CONSTRAINT IF EXISTS valid_bank_name_length;

-- Add comments explaining encrypted storage
COMMENT ON COLUMN withdrawals.account_number IS 'Encrypted bank account number (AES-256-GCM with SHA-256 derived key, base64 encoded)';
COMMENT ON COLUMN withdrawals.account_holder IS 'Encrypted account holder name (AES-256-GCM with SHA-256 derived key, base64 encoded)';
COMMENT ON COLUMN withdrawals.bank_name IS 'Bank name (plaintext - not sensitive)';