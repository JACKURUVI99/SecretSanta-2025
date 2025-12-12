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
-- 2. TASK QUESTIONS TABLE
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
    max_attempts INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 3. USER TASK SUBMISSIONS TABLE
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
CREATE OR REPLACE FUNCTION public.submit_bonus_task(p_user_id UUID, p_task_id UUID, p_answers JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_score INTEGER := 0;
    v_max_score INTEGER := 0;
    v_question RECORD;
    v_user_answer TEXT;
    v_is_correct BOOLEAN;
BEGIN
    IF EXISTS (SELECT 1 FROM public.user_task_submissions WHERE user_id = p_user_id AND task_id = p_task_id) THEN
        RAISE EXCEPTION 'Task already submitted';
    END IF;
    FOR v_question IN (SELECT * FROM public.task_questions WHERE task_id = p_task_id ORDER BY question_order) LOOP
        v_max_score := v_max_score + v_question.points;
        SELECT value::TEXT INTO v_user_answer FROM jsonb_array_elements(p_answers)
        WHERE value->>'question_id' = v_question.id::TEXT;
        IF v_user_answer IS NULL THEN CONTINUE; END IF;
        v_user_answer := (v_user_answer::JSONB)->>'answer';
        CASE v_question.question_type
            WHEN 'mcq' THEN
                v_is_correct := (v_user_answer = (v_question.correct_answer::TEXT));
            WHEN 'fill_blank' THEN
                IF v_question.is_case_sensitive THEN
                    v_is_correct := (v_user_answer = (v_question.correct_answer::TEXT));
                ELSE
                    v_is_correct := (UPPER(v_user_answer) = UPPER(v_question.correct_answer::TEXT));
                END IF;
            WHEN 'checkbox' THEN
                v_is_correct := (
                    SELECT COUNT(*) = 0 FROM (
                        SELECT jsonb_array_elements_text(v_user_answer::JSONB)
                        EXCEPT
                        SELECT jsonb_array_elements_text(v_question.correct_answer)
                    ) AS diff
                );
            ELSE
                v_is_correct := FALSE;
        END CASE;
        IF v_is_correct THEN 
            v_score := v_score + 4;  -- +4 for correct answer
        ELSE
            v_score := v_score - 1;  -- -1 for wrong answer
        END IF;
    END LOOP;
    INSERT INTO public.user_task_submissions (user_id, task_id, answers, score, max_score)
    VALUES (p_user_id, p_task_id, p_answers, v_score, v_max_score);
    UPDATE public.profiles SET points = points + v_score WHERE id = p_user_id;
    RETURN jsonb_build_object('score', v_score, 'max_score', v_max_score, 'percentage', ROUND((v_score::DECIMAL / NULLIF(v_max_score, 0)) * 100, 2));
END;
$$;
-- 7. GET TODAY'S TASK FUNCTION
CREATE OR REPLACE FUNCTION public.get_todays_bonus_task(p_user_id UUID)
RETURNS TABLE (task_id UUID, task_title TEXT, task_description TEXT, task_points INTEGER, already_submitted BOOLEAN, user_score INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT bt.id, bt.title, bt.description, bt.total_points,
           EXISTS(SELECT 1 FROM public.user_task_submissions WHERE user_id = p_user_id AND task_id = bt.id),
           COALESCE((SELECT score FROM public.user_task_submissions WHERE user_id = p_user_id AND task_id = bt.id), 0)
    FROM public.bonus_tasks bt
    WHERE bt.is_active = TRUE AND bt.task_date = CURRENT_DATE LIMIT 1;
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
