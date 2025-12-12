-- ADD_SANTA_RUN_SETTING.sql
-- Run this to enable the "Santa Run" toggle in Settings

-- Check if column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_settings' AND column_name='show_santa_run') THEN
        ALTER TABLE public.app_settings ADD COLUMN show_santa_run BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Force schema reload so the API knows about the new column
NOTIFY pgrst, 'reload schema';
