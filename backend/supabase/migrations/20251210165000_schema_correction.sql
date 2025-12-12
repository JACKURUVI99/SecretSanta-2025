-- =================================================================
-- SCHEMA CORRECTION & CACHE RELOAD
-- Run this if you are missing columns like 'favorite_emoji'
-- =================================================================

-- 1. Ensure Columns Exist (Safe to run multiple times)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.profiles ADD COLUMN favorite_emoji TEXT DEFAULT '🎅';
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN points INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE public.profiles ADD COLUMN roll_number TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- 2. Force PostgREST to refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- 3. Double Check: Allow Insert (Just in case)
DROP POLICY IF EXISTS "Self insert" ON public.profiles;
CREATE POLICY "Self insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Confirm Email for everyone (Again, to be safe)
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
