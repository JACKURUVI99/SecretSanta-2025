-- FIX SETTINGS SYNC (Unifying app_settings and admin_settings)
-- This script makes 'app_settings' the single source of truth, matching the application code.

BEGIN;

-- 1. Ensure app_settings has all columns (Merging from admin_settings schema)
CREATE TABLE IF NOT EXISTS public.app_settings (
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
    show_santa_run BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any potentially missing columns to app_settings
DO $$
BEGIN
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_mollywood BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_tollywood BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_bollywood BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_hollywood BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_games BOOLEAN DEFAULT TRUE;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_tictactoe BOOLEAN DEFAULT TRUE;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_memory_game BOOLEAN DEFAULT TRUE;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS secret_santa_reveal BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_santa_run BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- 2. Migrate data from admin_settings if app_settings is default/empty
-- We prefer changes made in admin_settings if they are recent
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_settings') THEN
        -- Update app_settings with values from admin_settings (assuming single row)
        UPDATE public.app_settings
        SET
            gifting_day = sub.gifting_day,
            registration_open = sub.registration_open,
            show_kollywood = sub.show_kollywood,
            show_mollywood = sub.show_mollywood,
            show_tollywood = sub.show_tollywood,
            show_bollywood = sub.show_bollywood,
            show_hollywood = sub.show_hollywood,
            show_bonus_tasks = sub.show_bonus_tasks,
            show_leaderboard = sub.show_leaderboard,
            show_news = sub.show_news,
            show_secret_santa = sub.show_secret_santa,
            show_gifting_day = sub.show_gifting_day,
            show_games = sub.show_games,
            show_tictactoe = sub.show_tictactoe,
            show_memory_game = sub.show_memory_game,
            maintenance_mode = sub.maintenance_mode,
            secret_santa_reveal = sub.secret_santa_reveal
        FROM (SELECT * FROM public.admin_settings LIMIT 1) as sub
        WHERE public.app_settings.id IS NOT NULL;
    END IF;
END $$;

-- 3. Ensure proper RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.app_settings;
CREATE POLICY "Settings viewable by everyone" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update settings" ON public.app_settings;
CREATE POLICY "Admins can update settings" ON public.app_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Insert default if table empty
INSERT INTO public.app_settings (
    gifting_day, registration_open, show_kollywood, show_bonus_tasks, 
    show_leaderboard, show_news, show_secret_santa, show_gifting_day,
    show_games, show_tictactoe, show_memory_game, maintenance_mode, secret_santa_reveal
)
SELECT 
    NOW() + INTERVAL '7 days', TRUE, TRUE, TRUE, 
    TRUE, TRUE, FALSE, TRUE,
    TRUE, TRUE, TRUE, FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);


-- 4. FIX THE RPCs TO POINT TO app_settings

-- get_public_settings -> Should read from app_settings
CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT to_jsonb(s.*) INTO result FROM public.app_settings s LIMIT 1;
    RETURN result;
END;
$$;

-- update_admin_settings -> Should update app_settings (used by AdminDashboard directly via table update usually, but just in case)
CREATE OR REPLACE FUNCTION public.update_admin_settings(p_settings jsonb)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
        RAISE EXCEPTION 'Access Denied';
    END IF;

    UPDATE public.app_settings
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
        show_santa_run = (p_settings->>'show_santa_run')::boolean,
        updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_settings TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_admin_settings TO authenticated;

COMMIT;
