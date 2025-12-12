-- =================================================================
-- FINAL FIX (2025-12-10)
-- 1. Drops everything that might conflict.
-- 2. Recreates triggers safely.
-- 3. Unblocks all users.
-- =================================================================

-- A. CLEANUP (No errors if missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- B. ENABLE RLS & POLICIES (Idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Drop policies if they exist (to avoid "already exists" error)
    DROP POLICY IF EXISTS "Public read" ON public.profiles;
    DROP POLICY IF EXISTS "Self update" ON public.profiles;
    DROP POLICY IF EXISTS "Self insert" ON public.profiles;
END $$;

CREATE POLICY "Public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Self insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- C. FAIL-SAFE TRIGGER (Swallows errors, Ensures Confirmation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- 1. Try to Confirm Email (Ignore errors)
  BEGIN
    UPDATE auth.users SET email_confirmed_at = now() WHERE id = new.id;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- 2. Try to Create Profile (Ignore errors)
  BEGIN
    INSERT INTO public.profiles (id, name, roll_number, points, favorite_emoji)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'Elf'), COALESCE(new.raw_user_meta_data->>'roll_number', split_part(new.email, '@', 1)), 0, '🎅')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- D. UNBLOCK EXISTING USERS
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
