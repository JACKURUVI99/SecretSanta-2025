-- Add missing columns to app_settings for new games and movie categories
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS show_flappy_santa BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_mollywood BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_tollywood BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_bollywood BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_hollywood BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_santa_run BOOLEAN DEFAULT FALSE;

-- Ensure a row exists (Using ID 1 as it is an integer PK)
INSERT INTO app_settings (id, show_flappy_santa, show_mollywood, show_tollywood, show_bollywood, show_hollywood)
VALUES (1, FALSE, FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;
