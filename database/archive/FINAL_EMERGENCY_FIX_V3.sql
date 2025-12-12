BEGIN;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id LIMIT 1),
    false
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;
CREATE POLICY "profiles_read_all_v3"
ON public.profiles FOR SELECT
USING (true);
CREATE POLICY "profiles_insert_own_v3"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_v3"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = id OR public.is_admin(auth.uid())
);
COMMIT;
NOTIFY pgrst, 'reload schema';
