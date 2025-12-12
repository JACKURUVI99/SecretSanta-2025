BEGIN;
DROP FUNCTION IF EXISTS public.get_todays_bonus_task(UUID);
DROP FUNCTION IF EXISTS public.get_todays_bonus_task(TEXT);
CREATE OR REPLACE FUNCTION public.get_todays_bonus_task(user_uuid UUID)
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
            WHERE uts.user_id = user_uuid 
            AND uts.task_id = bt.id
        ) AS already_submitted,
        COALESCE(
            (
                SELECT uts.score 
                FROM public.user_task_submissions AS uts 
                WHERE uts.user_id = user_uuid 
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
CREATE TABLE IF NOT EXISTS public.user_task_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.bonus_tasks(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    attempt_number INTEGER DEFAULT 1,
    UNIQUE(user_id, task_id)
);
ALTER TABLE public.user_task_submissions ENABLE ROW LEVEL SECURITY;
-- 4. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
COMMIT;
