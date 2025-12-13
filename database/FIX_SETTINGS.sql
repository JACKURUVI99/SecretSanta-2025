-- Add missing Game Module columns to app_settings
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_tictactoe BOOLEAN DEFAULT FALSE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_kollywood BOOLEAN DEFAULT FALSE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_mollywood BOOLEAN DEFAULT FALSE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_tollywood BOOLEAN DEFAULT FALSE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_bollywood BOOLEAN DEFAULT FALSE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_hollywood BOOLEAN DEFAULT FALSE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_memory_game BOOLEAN DEFAULT FALSE;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload schema';
