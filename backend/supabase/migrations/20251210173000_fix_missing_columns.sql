-- FIX: Add Missing Columns & Seed Data to prevent 400/406 Errors

-- 1. Fix Profiles Table (Missing created_at)
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Fix Tasks Table (Missing task_date)
DO $$
BEGIN
    ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Fix App Settings (Missing Row causing 406 on .single())
INSERT INTO public.app_settings (id, gifting_day, registration_open)
VALUES (1, '2025-12-25 00:00:00+00', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Reload Schema Cache for API
NOTIFY pgrst, 'reload schema';
