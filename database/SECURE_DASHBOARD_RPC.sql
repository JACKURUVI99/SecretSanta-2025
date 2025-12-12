BEGIN;
CREATE OR REPLACE FUNCTION public.get_dashboard_tasks(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', t.id,
            'title', t.title,
            'description', t.description,
            'points', t.points,
            'task_date', t.task_date,
            -- REMOVED 'created_at' (not in table)
            'userTask', CASE 
                WHEN ut.id IS NOT NULL THEN jsonb_build_object(
                    'id', ut.id,
                    'user_id', ut.user_id,
                    'task_id', ut.task_id,
                    'completed', ut.completed
                    -- REMOVED 'completed_at' (not in table)
                )
                ELSE NULL 
            END
        ) ORDER BY t.task_date DESC
    ) INTO v_result
    FROM tasks t
    LEFT JOIN user_tasks ut ON t.id = ut.task_id AND ut.user_id = p_user_id;
    RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
