BEGIN;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_settings' AND column_name='maintenance_mode') THEN
        ALTER TABLE public.app_settings ADD COLUMN maintenance_mode BOOLEAN DEFAULT false;
    END IF;
END $$;
-- 2. Ensure Admins can control it (RLS)
-- Existing 'settings_admin_all' policy should cover it, but let's be safe.
-- We rely on the generic UPDATE policy for app_settings.
COMMIT;
NOTIFY pgrst, 'reload schema';
