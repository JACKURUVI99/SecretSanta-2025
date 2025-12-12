-- Emergency Repair for Admin Settings and Dashboard
-- This script reconstructs the admin_settings table if missing and ensures all RPCs exist.

BEGIN;

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gifting_day TIMESTAMP WITH TIME ZONE,
    registration_open BOOLEAN DEFAULT TRUE,
    show_kollywood BOOLEAN DEFAULT FALSE,
    show_mollywood BOOLEAN DEFAULT FALSE,
    show_tollywood BOOLEAN DEFAULT FALSE,
    show_bollywood BOOLEAN DEFAULT FALSE,
    show_hollywood BOOLEAN DEFAULT FALSE,
    show_bonus_tasks BOOLEAN DEFAULT FALSE,
    show_leaderboard BOOLEAN DEFAULT TRUE,
    show_news BOOLEAN DEFAULT TRUE,
    show_secret_santa BOOLEAN DEFAULT FALSE,
    show_gifting_day BOOLEAN DEFAULT FALSE,
    show_games BOOLEAN DEFAULT TRUE,
    show_tictactoe BOOLEAN DEFAULT TRUE,
    show_memory_game BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    secret_santa_reveal BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add Missing Columns (Idempotent for existing tables)
DO $$
BEGIN
    ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS show_mollywood BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS show_tollywood BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS show_bollywood BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS show_hollywood BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS show_games BOOLEAN DEFAULT TRUE;
    ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS show_tictactoe BOOLEAN DEFAULT TRUE;
    ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS show_memory_game BOOLEAN DEFAULT TRUE;
    ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS secret_santa_reveal BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- 3. Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Public read access" ON public.admin_settings;
CREATE POLICY "Public read access" ON public.admin_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update settings" ON public.admin_settings;
CREATE POLICY "Admins can update settings" ON public.admin_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 5. Insert Default Row if Empty
INSERT INTO public.admin_settings (
    gifting_day, registration_open, show_kollywood, show_bonus_tasks, 
    show_leaderboard, show_news, show_secret_santa, show_gifting_day,
    show_games, show_tictactoe, show_memory_game, maintenance_mode, secret_santa_reveal
)
SELECT 
    NOW() + INTERVAL '7 days', TRUE, TRUE, TRUE, 
    TRUE, TRUE, FALSE, TRUE,
    TRUE, TRUE, TRUE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);

-- 6. RPC: get_public_settings
CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT to_jsonb(s.*) INTO result FROM public.admin_settings s LIMIT 1;
    RETURN result;
END;
$$;

-- 7. RPC: update_admin_settings
CREATE OR REPLACE FUNCTION public.update_admin_settings(p_settings jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    UPDATE public.admin_settings
    SET
        gifting_day = (p_settings->>'gifting_day')::timestamp with time zone,
        registration_open = (p_settings->>'registration_open')::boolean,
        show_kollywood = (p_settings->>'show_kollywood')::boolean,
        show_mollywood = (p_settings->>'show_mollywood')::boolean,
        show_tollywood = (p_settings->>'show_tollywood')::boolean,
        show_bollywood = (p_settings->>'show_bollywood')::boolean,
        show_hollywood = (p_settings->>'show_hollywood')::boolean,
        show_bonus_tasks = (p_settings->>'show_bonus_tasks')::boolean,
        show_leaderboard = (p_settings->>'show_leaderboard')::boolean,
        show_news = (p_settings->>'show_news')::boolean,
        show_secret_santa = (p_settings->>'show_secret_santa')::boolean,
        show_gifting_day = (p_settings->>'show_gifting_day')::boolean,
        show_games = (p_settings->>'show_games')::boolean,
        show_tictactoe = (p_settings->>'show_tictactoe')::boolean,
        show_memory_game = (p_settings->>'show_memory_game')::boolean,
        maintenance_mode = (p_settings->>'maintenance_mode')::boolean,
        secret_santa_reveal = (p_settings->>'secret_santa_reveal')::boolean,
        updated_at = NOW();
END;
$$;

-- 8. Grant Execute Permissions
GRANT EXECUTE ON FUNCTION public.get_public_settings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_admin_settings TO authenticated;

COMMIT;
