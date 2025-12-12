DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'show_gifting_day') THEN
        ALTER TABLE public.app_settings ADD COLUMN show_gifting_day BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
