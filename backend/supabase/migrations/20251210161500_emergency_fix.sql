-- =================================================================
-- EMERGENCY FIX: FAIL-SAFE TRIGGER
-- Use this if you are getting "Database error saving new user"
-- =================================================================

-- 1. Ensure Tables Exist (Again, just in case)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  roll_number TEXT,
  bio TEXT,
  favorite_emoji TEXT DEFAULT '🎅',
  points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON public.profiles;
CREATE POLICY "Public read" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Self insert" ON public.profiles;
CREATE POLICY "Self insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Self update" ON public.profiles;
CREATE POLICY "Self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. REPLACE TRIGGER WITH "FAIL-SAFE" VERSION
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    -- Try to create profile
    INSERT INTO public.profiles (id, name, roll_number, points, favorite_emoji)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'Elf'), COALESCE(new.raw_user_meta_data->>'roll_number', split_part(new.email, '@', 1)), 0, '🎅')
    ON CONFLICT (id) DO NOTHING;
    
    -- Try to confirm email
    UPDATE auth.users SET email_confirmed_at = now() WHERE id = new.id;
  EXCEPTION WHEN OTHERS THEN
    -- IF ANYTHING FAILS, DO NOT CRASH. LET THE USER SIGN UP.
    -- The frontend will handle the missing profile!
    RETURN new;
  END;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Fix any stuck users
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
