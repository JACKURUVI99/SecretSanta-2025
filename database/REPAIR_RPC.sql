BEGIN;
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
