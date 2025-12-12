BEGIN;
ALTER TABLE IF EXISTS public.user_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own legacy tasks" ON public.user_tasks;
CREATE POLICY "Users view own legacy tasks" ON public.user_tasks 
FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own legacy tasks" ON public.user_tasks;
CREATE POLICY "Users update own legacy tasks" ON public.user_tasks 
FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own legacy tasks" ON public.user_tasks;
CREATE POLICY "Users insert own legacy tasks" ON public.user_tasks 
FOR INSERT WITH CHECK (auth.uid() = user_id);
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view legacy tasks" ON public.tasks;
CREATE POLICY "Everyone can view legacy tasks" ON public.tasks 
FOR SELECT USING (true);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'global_chat'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE global_chat;
    END IF;
END
$$;
ALTER TABLE IF EXISTS public.global_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.global_chat REPLICA IDENTITY FULL;
DROP POLICY IF EXISTS "Everyone can view chat" ON public.global_chat;
CREATE POLICY "Everyone can view chat" ON public.global_chat 
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert messages" ON public.global_chat;
CREATE POLICY "Users can insert messages" ON public.global_chat 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
NOTIFY pgrst, 'reload schema';
COMMIT;
