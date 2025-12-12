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
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "profiles_admin_all"
ON public.profiles FOR ALL
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "pairings_admin_all" ON public.pairings;
CREATE POLICY "pairings_admin_all" ON public.pairings FOR ALL
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "bonus_tasks_admin_all" ON public.bonus_tasks;
CREATE POLICY "bonus_tasks_admin_all" ON public.bonus_tasks FOR ALL
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "task_questions_admin_all" ON public.task_questions;
CREATE POLICY "task_questions_admin_all" ON public.task_questions FOR ALL
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "submissions_admin_select" ON public.user_task_submissions;
CREATE POLICY "submissions_admin_select" ON public.user_task_submissions FOR SELECT
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "news_admin_all" ON public.news_feed;
CREATE POLICY "news_admin_all" ON public.news_feed FOR ALL
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "checkins_admin_select" ON public.daily_checkins;
CREATE POLICY "checkins_admin_select" ON public.daily_checkins FOR SELECT
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "words_admin_all" ON public.word_bank;
CREATE POLICY "words_admin_all" ON public.word_bank FOR ALL
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "word_progress_admin_select" ON public.user_word_progress;
CREATE POLICY "word_progress_admin_select" ON public.user_word_progress FOR SELECT
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "settings_admin_all" ON public.app_settings;
CREATE POLICY "settings_admin_all" ON public.app_settings FOR ALL
USING (public.is_admin(auth.uid()) = true);
COMMIT;
NOTIFY pgrst, 'reload schema';
