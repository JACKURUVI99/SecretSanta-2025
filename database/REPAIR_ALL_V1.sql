BEGIN;
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
ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pairings_select_own" ON public.pairings;
DROP POLICY IF EXISTS "pairings_admin_all" ON public.pairings;
DROP POLICY IF EXISTS "pairings_admin_full" ON public.pairings;
CREATE POLICY "pairings_select_own"
ON public.pairings FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = secret_santa_id);
CREATE POLICY "pairings_admin_full"
ON public.pairings FOR ALL
USING (public.is_admin(auth.uid()) = true);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_read_all" ON public.app_settings;
DROP POLICY IF EXISTS "settings_admin_all" ON public.app_settings;
CREATE POLICY "settings_read_all"
ON public.app_settings FOR SELECT
USING (true);
CREATE POLICY "settings_admin_all"
ON public.app_settings FOR ALL
USING (public.is_admin(auth.uid()) = true);
ALTER TABLE public.bonus_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_read_all" ON public.bonus_tasks;
DROP POLICY IF EXISTS "tasks_admin_all" ON public.bonus_tasks;
CREATE POLICY "tasks_read_all"
ON public.bonus_tasks FOR SELECT
USING (true);
CREATE POLICY "tasks_admin_all"
ON public.bonus_tasks FOR ALL
USING (public.is_admin(auth.uid()) = true);
ALTER TABLE public.word_bank ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "words_read_all" ON public.word_bank;
DROP POLICY IF EXISTS "words_admin_all" ON public.word_bank;
CREATE POLICY "words_read_all"
ON public.word_bank FOR SELECT
USING (true);
CREATE POLICY "words_admin_all"
ON public.word_bank FOR ALL
USING (public.is_admin(auth.uid()) = true);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_read_all"
ON public.profiles FOR SELECT
USING (true);
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all"
ON public.profiles FOR ALL
USING (public.is_admin(auth.uid()) = true);
COMMIT;
NOTIFY pgrst, 'reload schema';
