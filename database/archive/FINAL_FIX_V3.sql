BEGIN;
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = user_id LIMIT 1),
    false
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO public;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;
DROP POLICY IF EXISTS "pairings_admin_all" ON public.pairings;
DROP POLICY IF EXISTS "pairings_select_own" ON public.pairings;
CREATE POLICY "pairings_select_own" ON public.pairings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pairings_admin_all" ON public.pairings FOR ALL USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "settings_read_all" ON public.app_settings;
DROP POLICY IF EXISTS "settings_admin_all" ON public.app_settings;
CREATE POLICY "settings_read_all" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_all" ON public.app_settings FOR ALL USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "bonus_tasks_read_all" ON public.bonus_tasks;
DROP POLICY IF EXISTS "bonus_tasks_admin_all" ON public.bonus_tasks;
CREATE POLICY "bonus_tasks_read_all" ON public.bonus_tasks FOR SELECT USING (true);
CREATE POLICY "bonus_tasks_admin_all" ON public.bonus_tasks FOR ALL USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "tasks_read_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_admin_all" ON public.tasks;
CREATE POLICY "tasks_read_all" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "tasks_admin_all" ON public.tasks FOR ALL USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "task_questions_read_all" ON public.task_questions;
DROP POLICY IF EXISTS "task_questions_admin_all" ON public.task_questions;
CREATE POLICY "task_questions_read_all" ON public.task_questions FOR SELECT USING (true);
CREATE POLICY "task_questions_admin_all" ON public.task_questions FOR ALL USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "news_read_all" ON public.news_feed;
DROP POLICY IF EXISTS "news_admin_all" ON public.news_feed;
CREATE POLICY "news_read_all" ON public.news_feed FOR SELECT USING (true);
CREATE POLICY "news_admin_all" ON public.news_feed FOR ALL USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "word_bank_read_all" ON public.word_bank;
DROP POLICY IF EXISTS "words_admin_all" ON public.word_bank;
CREATE POLICY "word_bank_read_all" ON public.word_bank FOR SELECT USING (true);
CREATE POLICY "words_admin_all" ON public.word_bank FOR ALL USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (public.is_admin(auth.uid()) = true);
COMMIT;
NOTIFY pgrst, 'reload schema';
