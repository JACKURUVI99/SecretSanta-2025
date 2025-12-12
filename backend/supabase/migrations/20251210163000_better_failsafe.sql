-- =================================================================
-- REFINED FAIL-SAFE: Split Operations
-- Use this to ensure Email is Confirmed even if Profile fails
-- =================================================================

-- 1. Ensure Policies (Idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Self insert" ON public.profiles;
CREATE POLICY "Self insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Self update" ON public.profiles;
CREATE POLICY "Self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Public read" ON public.profiles;
CREATE POLICY "Public read" ON public.profiles FOR SELECT USING (true);

-- 2. BETTER TRIGGER (Split Blocks)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- BLOCK 1: Confirm Email (Critical for Login)
  BEGIN
    UPDATE auth.users SET email_confirmed_at = now() WHERE id = new.id;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error
  END;

  -- BLOCK 2: Create Profile (Optional - Client can backup)
  BEGIN
    INSERT INTO public.profiles (id, name, roll_number, points, favorite_emoji)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'Elf'), COALESCE(new.raw_user_meta_data->>'roll_number', split_part(new.email, '@', 1)), 0, '🎅')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore error
  END;

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. UNSTICK CURRENT USER (Force Confirm)
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
