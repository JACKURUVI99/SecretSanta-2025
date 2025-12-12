-- Fix Tasks Table RLS and Schema
-- 1. Ensure task_date is TIMESTAMPTZ (for consistency)
DO $$
BEGIN
    ALTER TABLE public.tasks ALTER COLUMN task_date TYPE TIMESTAMP WITH TIME ZONE USING task_date::TIMESTAMP WITH TIME ZONE;
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if it fails or already correct
END $$;

-- 2. Drop ALL existing policies on tasks to start fresh
DROP POLICY IF EXISTS "Tasks viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Users can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;

-- 3. Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. Recreate Policies

-- Everyone can VIEW tasks
CREATE POLICY "Tasks viewable by everyone" 
ON public.tasks FOR SELECT 
USING (true);

-- Admins can INSERT tasks
CREATE POLICY "Admins can insert tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Admins can UPDATE tasks
CREATE POLICY "Admins can update tasks" 
ON public.tasks FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Admins can DELETE tasks
CREATE POLICY "Admins can delete tasks" 
ON public.tasks FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- 5. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';
