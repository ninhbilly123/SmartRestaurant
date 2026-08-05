ALTER TABLE verified_emails
  ALTER COLUMN otp_code TYPE VARCHAR(255),
  ALTER COLUMN verification_token TYPE VARCHAR(255);
