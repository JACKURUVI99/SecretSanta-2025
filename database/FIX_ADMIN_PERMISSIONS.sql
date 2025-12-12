BEGIN;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_admin_update"
ON public.profiles FOR UPDATE
USING (public.is_admin(auth.uid()) = true);
CREATE POLICY "profiles_admin_delete"
ON public.profiles FOR DELETE
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "pairings_select_own_target" ON public.pairings;
DROP POLICY IF EXISTS "pairings_admin_all" ON public.pairings;
DROP POLICY IF EXISTS "Admins manage pairings" ON public.pairings;
DROP POLICY IF EXISTS "Users view their target" ON public.pairings;
CREATE POLICY "pairings_select_own_target"
ON public.pairings FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "pairings_admin_all"
ON public.pairings FOR ALL
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "settings_select_all" ON public.app_settings;
DROP POLICY IF EXISTS "settings_admin_all" ON public.app_settings;
DROP POLICY IF EXISTS "Everyone can view settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins manage settings" ON public.app_settings;
CREATE POLICY "settings_select_all"
ON public.app_settings FOR SELECT
USING (true);
CREATE POLICY "settings_admin_all"
ON public.app_settings FOR ALL
USING (public.is_admin(auth.uid()) = true);
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(is_admin, false) FROM public.profiles WHERE id = user_id LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon;
COMMIT;
NOTIFY pgrst, 'reload schema';
