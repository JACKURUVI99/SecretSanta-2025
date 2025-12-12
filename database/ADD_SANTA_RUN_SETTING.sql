-- ADD_SANTA_RUN_SETTING.sql
-- Adds the 'show_santa_run' toggle to the app_settings table

ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS show_santa_run BOOLEAN DEFAULT false;

-- Notify schema reload for Supabase clients
NOTIFY pgrst, 'reload schema';
