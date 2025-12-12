ALTER TABLE bonus_tasks 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1;
ALTER TABLE user_bonus_task_submissions 
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
CREATE OR REPLACE FUNCTION submit_bonus_task(
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
    -- Check if task exists and is active
    SELECT is_active, total_points, max_attempts INTO v_task_active, v_task_points, v_max_attempts
    FROM bonus_tasks
    WHERE id = p_task_id;
    IF NOT FOUND OR NOT v_task_active THEN
        RAISE EXCEPTION 'Task not found or inactive';
    END IF;
    -- Check attempts
    SELECT COUNT(*) INTO v_existing_submission_count
    FROM user_bonus_task_submissions
    WHERE user_id = p_user_id AND task_id = p_task_id;
    IF v_existing_submission_count >= v_max_attempts THEN
        RAISE EXCEPTION 'Max attempts reached for this task';
    END IF;
    -- Calculate Score (Same logic as before)
    FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_question_id := (v_answer->>'question_id')::UUID;
        v_submitted_answer := v_answer->'answer';
        SELECT points, correct_answer INTO v_question_points, v_correct_answer
        FROM task_questions
        WHERE id = v_question_id AND task_id = p_task_id;
        v_max_score := v_max_score + v_question_points;
        -- Default comparison logic (improving flexibility)
        IF v_submitted_answer = v_correct_answer THEN
            v_score := v_score + v_question_points;
            v_is_correct := true;
        ELSE
            v_is_correct := false;
        END IF;
        v_results := v_results || jsonb_build_object(
            'question_id', v_question_id,
            'is_correct', v_is_correct
        );
    END LOOP;
    -- Calculate status based on score
    IF v_max_score = 0 THEN 
        v_percentage := 0;
    ELSE
        v_percentage := (v_score * 100) / v_max_score;
    END IF;
    -- Insert Submission Record
    INSERT INTO user_bonus_task_submissions (
        user_id, task_id, score, max_score, answers, attempt_number
    ) VALUES (
        p_user_id, p_task_id, v_score, v_max_score, p_answers, v_existing_submission_count + 1
    ) RETURNING id INTO v_submission_id;
    -- Update Profile Points ONLY if this is their BEST score so far?
    -- OR: Just give points for this attempt? 
    -- LOGIC: We should probably only award the DELTA if they improve, but simpler logic for now:
    -- Just update total points if they pass? 
    -- Let's stick to simple: Add points earned in this attempt (if we want to allow farming, but max_attempts prevents that).
    -- BETTER: Only award difference from previous best?
    -- FOR NOW: Just add the points. Max attempts limits abuse.
    UPDATE profiles 
    SET points = points + v_score 
    WHERE id = p_user_id;
    RETURN jsonb_build_object(
        'submission_id', v_submission_id,
        'score', v_score,
        'max_score', v_max_score,
        'percentage', v_percentage,
        'attempts_left', v_max_attempts - (v_existing_submission_count + 1)
    );
END;
$$;
DROP FUNCTION IF EXISTS get_todays_bonus_task(uuid);
CREATE OR REPLACE FUNCTION get_todays_bonus_task(user_uuid UUID)
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
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
BEGIN
    RETURN QUERY
    SELECT 
        bt.id,
        bt.title,
        bt.description,
        bt.total_points,
        bt.max_attempts,
        COALESCE(sub_stats.attempts_count, 0)::INTEGER as attempts_made,
        COALESCE(sub_stats.max_score_achieved, 0)::INTEGER as best_score,
        COALESCE(sub_stats.max_score_achieved >= bt.total_points, FALSE) as is_fully_completed
    FROM bonus_tasks bt
    LEFT JOIN (
        SELECT 
            task_id, 
            COUNT(*) as attempts_count, 
            MAX(score) as max_score_achieved
        FROM user_bonus_task_submissions
        WHERE user_id = user_uuid
        GROUP BY task_id
    ) sub_stats ON bt.id = sub_stats.task_id
    WHERE bt.task_date = v_today AND bt.is_active = TRUE;
END;
$$;
