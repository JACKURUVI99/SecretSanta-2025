ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT DEFAULT 'Violation of rules';
