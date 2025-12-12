BEGIN;
DROP TABLE IF EXISTS public.user_task_submissions CASCADE;
DROP TABLE IF EXISTS public.task_questions CASCADE;
DROP TABLE IF EXISTS public.bonus_tasks CASCADE;
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
ALTER TABLE public.bonus_tasks ENABLE ROW LEVEL SECURITY;
-- RECREATE TASK QUESTIONS
CREATE TABLE IF NOT EXISTS public.task_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.bonus_tasks(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    options JSONB,
    correct_answer JSONB NOT NULL,
    points INTEGER DEFAULT 10,
    question_order INTEGER DEFAULT 0,
    is_case_sensitive BOOLEAN DEFAULT FALSE,
    max_attempts INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.task_questions ENABLE ROW LEVEL SECURITY;
-- RECREATE SUBMISSIONS (The one causing trouble likely)
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
DROP POLICY IF EXISTS "Admins manage bonus tasks" ON public.bonus_tasks;
CREATE POLICY "Admins manage bonus tasks" ON public.bonus_tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
DROP POLICY IF EXISTS "Users view active tasks" ON public.bonus_tasks;
CREATE POLICY "Users view active tasks" ON public.bonus_tasks FOR SELECT USING (
    is_active = TRUE AND task_date <= CURRENT_DATE
);
DROP POLICY IF EXISTS "Admins manage questions" ON public.task_questions;
CREATE POLICY "Admins manage questions" ON public.task_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
DROP POLICY IF EXISTS "Users view questions" ON public.task_questions;
CREATE POLICY "Users view questions" ON public.task_questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bonus_tasks WHERE id = task_questions.task_id AND is_active = TRUE)
);
DROP POLICY IF EXISTS "Users manage submissions" ON public.user_task_submissions;
CREATE POLICY "Users manage submissions" ON public.user_task_submissions FOR ALL USING (
    auth.uid() = user_id
);
DROP POLICY IF EXISTS "Admins view submissions" ON public.user_task_submissions;
CREATE POLICY "Admins view submissions" ON public.user_task_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
DROP FUNCTION IF EXISTS public.get_todays_bonus_task(UUID);
DROP FUNCTION IF EXISTS public.get_todays_bonus_task(TEXT);
CREATE OR REPLACE FUNCTION public.get_todays_bonus_task(param_user_id UUID)
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
            WHERE uts.user_id = param_user_id 
            AND uts.task_id = bt.id
        ) AS already_submitted,
        COALESCE(
            (
                SELECT uts.score 
                FROM public.user_task_submissions AS uts 
                WHERE uts.user_id = param_user_id 
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
DROP POLICY IF EXISTS "Pairings Access" ON public.pairings;
CREATE POLICY "Pairings Access" ON public.pairings FOR ALL USING (TRUE); 
NOTIFY pgrst, 'reload schema';
COMMIT;
