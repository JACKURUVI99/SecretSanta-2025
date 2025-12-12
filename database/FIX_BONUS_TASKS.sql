BEGIN;
DROP POLICY IF EXISTS "bonus_tasks_admin_all" ON public.bonus_tasks;
DROP POLICY IF EXISTS "bonus_tasks_read_all" ON public.bonus_tasks;
CREATE POLICY "bonus_tasks_read_all"
ON public.bonus_tasks FOR SELECT
USING (true);
CREATE POLICY "bonus_tasks_admin_all"
ON public.bonus_tasks FOR ALL
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "tasks_admin_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_read_all" ON public.tasks;
CREATE POLICY "tasks_read_all"
ON public.tasks FOR SELECT
USING (true);
CREATE POLICY "tasks_admin_all"
ON public.tasks FOR ALL
USING (public.is_admin(auth.uid()) = true);
DROP POLICY IF EXISTS "news_admin_all" ON public.news_feed;
DROP POLICY IF EXISTS "news_read_all" ON public.news_feed;
CREATE POLICY "news_read_all"
ON public.news_feed FOR SELECT
USING (true);
CREATE POLICY "news_admin_all"
ON public.news_feed FOR ALL
USING (public.is_admin(auth.uid()) = true);
COMMIT;
NOTIFY pgrst, 'reload schema';
