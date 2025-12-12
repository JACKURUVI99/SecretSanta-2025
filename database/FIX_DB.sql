BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
-- 2. SEED SETTINGS (Fixes 406 Error)
INSERT INTO public.app_settings (id, gifting_day, registration_open)
VALUES (1, '2025-12-25 00:00:00+00', true)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Tasks viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks viewable by everyone" 
ON public.tasks FOR SELECT 
USING (true);
CREATE POLICY "Admins can insert tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);
CREATE POLICY "Admins can update tasks" 
ON public.tasks FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);
CREATE POLICY "Admins can delete tasks" 
ON public.tasks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);
NOTIFY pgrst, 'reload schema';
COMMIT;
