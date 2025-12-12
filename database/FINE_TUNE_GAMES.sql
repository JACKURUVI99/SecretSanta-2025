BEGIN;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'show_mollywood') THEN
        ALTER TABLE public.app_settings ADD COLUMN show_mollywood BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'show_tollywood') THEN
        ALTER TABLE public.app_settings ADD COLUMN show_tollywood BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'show_bollywood') THEN
        ALTER TABLE public.app_settings ADD COLUMN show_bollywood BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'show_hollywood') THEN
        ALTER TABLE public.app_settings ADD COLUMN show_hollywood BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
NOTIFY pgrst, 'reload schema';
COMMIT;
