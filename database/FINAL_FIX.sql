BEGIN;
DROP FUNCTION IF EXISTS public.get_todays_bonus_task(UUID);
DROP FUNCTION IF EXISTS public.get_todays_bonus_task(TEXT);
CREATE OR REPLACE FUNCTION public.get_todays_bonus_task(p_user_id UUID)
RETURNS TABLE (
    task_id UUID, 
    task_title TEXT, 
    task_description TEXT, 
    task_points INTEGER, 
    already_submitted BOOLEAN, 
    user_score INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bt.id AS task_id, 
        bt.title AS task_title, 
        bt.description AS task_description, 
        bt.total_points AS task_points,
        EXISTS(
            SELECT 1 
            FROM public.user_task_submissions AS uts 
            WHERE uts.user_id = p_user_id 
            AND uts.task_id = bt.id
        ) AS already_submitted,
        COALESCE(
            (
                SELECT uts.score 
                FROM public.user_task_submissions AS uts 
                WHERE uts.user_id = p_user_id 
                AND uts.task_id = bt.id
            ), 
            0
        ) AS user_score
    FROM public.bonus_tasks AS bt
    WHERE bt.is_active = TRUE 
    AND bt.task_date = CURRENT_DATE 
    LIMIT 1;
END;
$$;
CREATE TABLE IF NOT EXISTS public.pairings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    secret_santa_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id),
    UNIQUE(secret_santa_id) 
);
ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage pairings" ON public.pairings;
CREATE POLICY "Admins manage pairings" ON public.pairings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));
DROP POLICY IF EXISTS "Users view target" ON public.pairings;
CREATE POLICY "Users view target" ON public.pairings FOR SELECT USING (auth.uid() = user_id);
CREATE TABLE IF NOT EXISTS public.bonus_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    task_date DATE NOT NULL,
    total_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.bonus_tasks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.bonus_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin Bonus access" ON public.bonus_tasks;
CREATE POLICY "Admin Bonus access" ON public.bonus_tasks FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE));
DROP POLICY IF EXISTS "User Bonus view" ON public.bonus_tasks;
CREATE POLICY "User Bonus view" ON public.bonus_tasks FOR SELECT USING (is_active = TRUE AND task_date <= CURRENT_DATE);
NOTIFY pgrst, 'reload schema';
COMMIT;
