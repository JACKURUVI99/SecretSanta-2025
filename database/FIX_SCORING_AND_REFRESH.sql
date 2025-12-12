-- FIX SCORING AND ADD REFRESH RPC

-- 1. Improved Bonus Task Submission (Fix Scoring Bug)
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
    v_is_case_sensitive BOOLEAN;
    v_submitted_answer JSONB;
    v_submitted_text TEXT;
    v_correct_text TEXT;
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

        SELECT points, correct_answer, is_case_sensitive
        INTO v_question_points, v_correct_answer, v_is_case_sensitive
        FROM task_questions
        WHERE id = v_question_id AND task_id = p_task_id;

        -- Default points if null
        v_question_points := COALESCE(v_question_points, 0);
        v_max_score := v_max_score + v_question_points;

        -- Strict Text Comparison Logic
        -- We coerce both to text, trim, and lowercase (unless sensitive)
        -- Removing surrounding quotes from JSON strings is critical
        v_submitted_text := TRIM(BOTH '"' FROM v_submitted_answer::text);
        v_correct_text := TRIM(BOTH '"' FROM v_correct_answer::text);

        IF v_is_case_sensitive THEN
            v_is_correct := (v_submitted_text = v_correct_text);
        ELSE
            v_is_correct := (LOWER(v_submitted_text) = LOWER(v_correct_text));
        END IF;

        IF v_is_correct THEN
            v_score := v_score + v_question_points;
        END IF;

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

-- 2. New RPC to Reset All Users' Daily Words (Refresh Questions)
CREATE OR REPLACE FUNCTION public.reset_all_user_daily_words()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete all progress for CURRENT DATE
    DELETE FROM public.user_word_progress 
    WHERE assigned_at = CURRENT_DATE;
END;
$$;
