ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS show_mollywood BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_tollywood BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_bollywood BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_hollywood BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_tictactoe BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_memory_game BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_games BOOLEAN DEFAULT true;
CREATE OR REPLACE FUNCTION get_public_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT to_jsonb(s.*)
    FROM app_settings s
    LIMIT 1
  );
END;
$$;
GRANT ALL ON app_settings TO service_role;
GRANT SELECT ON app_settings TO authenticated;
GRANT SELECT ON app_settings TO anon;
