-- Safely recreate the profile creation trigger
-- This ensures that when a user signs up, their profile is created with system permissions (bypassing RLS)

-- 1. Drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the function with SECURITY DEFINER (runs as superuser/creator)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public -- Secure search path
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, roll_number, points, favorite_emoji)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Elf'), -- Default Name
    COALESCE(new.raw_user_meta_data->>'roll_number', split_part(new.email, '@', 1)), -- Default Roll Number
    0,
    '🎅'
  )
  ON CONFLICT (id) DO NOTHING; -- If profile exists, do nothing
  RETURN new;
END;
$$;

-- 3. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
