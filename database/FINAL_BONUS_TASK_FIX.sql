BEGIN;
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
CREATE TABLE IF NOT EXISTS public.task_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.bonus_tasks(id) ON DELETE CASCADE,
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'fill_blank', 'checkbox', 'image_upload')),
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    options JSONB,
    correct_answer JSONB NOT NULL,
    points INTEGER DEFAULT 10,
    question_order INTEGER DEFAULT 0,
    is_case_sensitive BOOLEAN DEFAULT FALSE,
    max_attempts INTEGER, -- Legacy column kept for compatibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.user_task_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.bonus_tasks(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, task_id) -- Will drop this constraint momentarily to allow multiple attempts
);
-- 2. APPLY MIGRATIONS (Add new columns)
ALTER TABLE public.bonus_tasks 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;
ALTER TABLE public.user_task_submissions 
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
-- 3. REMOVE UNIQUE CONSTRAINT to allow multiple attempts
-- We use a safe DO block to drop the constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_task_submissions_user_id_task_id_key') THEN
        ALTER TABLE public.user_task_submissions DROP CONSTRAINT user_task_submissions_user_id_task_id_key;
    END IF;
END $$;
ALTER TABLE public.bonus_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access bonus tasks" ON public.bonus_tasks;
CREATE POLICY "Admins full access bonus tasks" ON public.bonus_tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
DROP POLICY IF EXISTS "Users view active tasks" ON public.bonus_tasks;
CREATE POLICY "Users view active tasks" ON public.bonus_tasks FOR SELECT USING (
    is_active = TRUE AND task_date <= CURRENT_DATE
);
DROP POLICY IF EXISTS "Admins full access questions" ON public.task_questions;
CREATE POLICY "Admins full access questions" ON public.task_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
DROP POLICY IF EXISTS "Users view questions of active tasks" ON public.task_questions;
CREATE POLICY "Users view questions of active tasks" ON public.task_questions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bonus_tasks 
        WHERE id = task_questions.task_id AND is_active = TRUE AND task_date <= CURRENT_DATE
    )
);
DROP POLICY IF EXISTS "Users insert own submissions" ON public.user_task_submissions;
CREATE POLICY "Users insert own submissions" ON public.user_task_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users view own submissions" ON public.user_task_submissions;
CREATE POLICY "Users view own submissions" ON public.user_task_submissions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins view all submissions" ON public.user_task_submissions;
CREATE POLICY "Admins view all submissions" ON public.user_task_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE OR REPLACE FUNCTION public.submit_bonus_task(
    p_user_id UUID,
    p_task_id UUID,
    p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_active BOOLEAN;
    v_task_points INTEGER;
    v_existing_submission_count INTEGER;
    v_max_attempts INTEGER;
    v_score INTEGER := 0;
    v_max_score INTEGER := 0;
    v_percentage INTEGER;
    v_answer JSONB;
    v_question_id UUID;
    v_question_points INTEGER;
    v_correct_answer JSONB;
    v_submitted_answer JSONB;
    v_is_correct BOOLEAN;
    v_submission_id UUID;
    v_results JSONB := '[]'::JSONB;
BEGIN
    -- Check task
    SELECT is_active, total_points, max_attempts INTO v_task_active, v_task_points, v_max_attempts
    FROM bonus_tasks
    WHERE id = p_task_id;
    IF NOT FOUND OR NOT v_task_active THEN
        RAISE EXCEPTION 'Task not found or inactive';
    END IF;
    -- Check attempts
    SELECT COUNT(*) INTO v_existing_submission_count
    FROM user_task_submissions
    WHERE user_id = p_user_id AND task_id = p_task_id;
    IF v_existing_submission_count >= v_max_attempts THEN
        RAISE EXCEPTION 'Max attempts reached. You have used % of % attempts.', v_existing_submission_count, v_max_attempts;
    END IF;
    -- Grade Logic
    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_question_id := (v_answer->>'question_id')::UUID;
        v_submitted_answer := v_answer->'answer';
        SELECT points, correct_answer INTO v_question_points, v_correct_answer
        FROM task_questions
        WHERE id = v_question_id AND task_id = p_task_id;
        v_max_score := v_max_score + v_question_points;
        if v_submitted_answer = v_correct_answer then
            v_score := v_score + v_question_points;
            v_is_correct := true;
        else
            v_is_correct := false;
        end if;
        v_results := v_results || jsonb_build_object('question_id', v_question_id, 'is_correct', v_is_correct);
    END LOOP;
    IF v_max_score = 0 THEN v_percentage := 0; ELSE v_percentage := (v_score * 100) / v_max_score; END IF;
    -- Insert Submission
    INSERT INTO user_task_submissions (user_id, task_id, score, max_score, answers, attempt_number)
    VALUES (p_user_id, p_task_id, v_score, v_max_score, p_answers, v_existing_submission_count + 1)
    RETURNING id INTO v_submission_id;
    -- Award points
    UPDATE profiles SET points = points + v_score WHERE id = p_user_id;
    RETURN jsonb_build_object(
        'submission_id', v_submission_id,
        'score', v_score,
        'max_score', v_max_score,
        'percentage', v_percentage,
        'attempts_left', v_max_attempts - (v_existing_submission_count + 1),
        'results', v_results
    );
END;
$$;
-- Update Getter
DROP FUNCTION IF EXISTS public.get_todays_bonus_task(uuid);
CREATE OR REPLACE FUNCTION public.get_todays_bonus_task(p_user_id UUID)
RETURNS TABLE (
    task_id UUID,
    task_title TEXT,
    task_description TEXT,
    task_points INTEGER,
    max_attempts INTEGER,
    attempts_made INTEGER,
    best_score INTEGER,
    is_fully_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
BEGIN
    RETURN QUERY
    SELECT 
        bt.id, bt.title, bt.description, bt.total_points, bt.max_attempts,
        COALESCE(sub_stats.attempts_count, 0)::INTEGER,
        COALESCE(sub_stats.max_score_achieved, 0)::INTEGER,
        COALESCE(sub_stats.max_score_achieved >= bt.total_points, FALSE)
    FROM bonus_tasks bt
    LEFT JOIN (
        SELECT task_id, COUNT(*) as attempts_count, MAX(score) as max_score_achieved
        FROM user_task_submissions
        WHERE user_id = p_user_id
        GROUP BY task_id
    ) sub_stats ON bt.id = sub_stats.task_id
    WHERE bt.task_date = v_today AND bt.is_active = TRUE;
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
