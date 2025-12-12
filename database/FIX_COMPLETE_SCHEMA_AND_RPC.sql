BEGIN;
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='created_at') THEN
        ALTER TABLE public.tasks ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
-- Fix USER_TASKS table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_tasks' AND column_name='completed_at') THEN
        ALTER TABLE public.user_tasks ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;
-- Fix PROFILES table (Ensure avatar_url and bio exist for Pairings RPC)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;
END $$;
DROP FUNCTION IF EXISTS public.get_dashboard_tasks(UUID);
DROP FUNCTION IF EXISTS public.toggle_dashboard_task(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_pairings(UUID);
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
            'created_at', t.created_at,  -- Now safe
            'userTask', CASE 
                WHEN ut.id IS NOT NULL THEN jsonb_build_object(
                    'id', ut.id,
                    'user_id', ut.user_id,
                    'task_id', ut.task_id,
                    'completed', ut.completed,
                    'completed_at', ut.completed_at -- Now safe
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
-- RPC: Toggle Config (Server-Side Logic)
CREATE OR REPLACE FUNCTION public.toggle_dashboard_task(p_user_id UUID, p_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_points INT;
    v_current_user_points INT;
    v_user_task_id UUID;
    v_is_completed BOOLEAN;
    v_profile_exists BOOLEAN;
BEGIN
    -- 1. Verify Task & Get Points
    SELECT points INTO v_task_points FROM tasks WHERE id = p_task_id;
    IF v_task_points IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Task not found');
    END IF;
    -- 2. Check current status
    SELECT id, completed INTO v_user_task_id, v_is_completed
    FROM user_tasks 
    WHERE user_id = p_user_id AND task_id = p_task_id;
    -- 3. Update or Insert
    IF v_user_task_id IS NOT NULL THEN
        -- Toggle
        UPDATE user_tasks 
        SET completed = NOT v_is_completed,
            completed_at = CASE WHEN NOT v_is_completed THEN NOW() ELSE NULL END -- Now safe
        WHERE id = v_user_task_id;
        -- If we just UN-completed, negate points
        IF v_is_completed THEN
            v_task_points := -v_task_points;
        END IF; 
        -- If we just Completed (was false), points remain positive
    ELSE
        -- Insert (First time completion)
        INSERT INTO user_tasks (user_id, task_id, completed, completed_at)
        VALUES (p_user_id, p_task_id, TRUE, NOW()); -- Now safe
    END IF;
    -- 4. Update Profile Points
    UPDATE profiles 
    SET points = points + v_task_points 
    WHERE id = p_user_id
    RETURNING points INTO v_current_user_points;
    RETURN jsonb_build_object('success', true, 'new_points', v_current_user_points);
END;
$$;
-- RPC: Get User Pairings (Secure)
CREATE OR REPLACE FUNCTION public.get_user_pairings(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_santa JSONB;
    v_giftee JSONB;
BEGIN
    -- Get MY Santa (Who is giving to me?)
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'favorite_emoji', p.favorite_emoji,
        'bio', p.bio,              -- Now safe
        'avatar_url', p.avatar_url -- Now safe
    ) INTO v_santa
    FROM pairings pr
    JOIN profiles p ON pr.secret_santa_id = p.id
    WHERE pr.user_id = p_user_id;
    -- Get MY Giftee (Who am I giving to?)
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'favorite_emoji', p.favorite_emoji,
        'bio', p.bio,              -- Now safe
        'avatar_url', p.avatar_url -- Now safe
    ) INTO v_giftee
    FROM pairings pr
    JOIN profiles p ON pr.user_id = p.id
    WHERE pr.secret_santa_id = p_user_id;
    RETURN jsonb_build_object(
        'santa', v_santa,
        'giftee', v_giftee
    );
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
