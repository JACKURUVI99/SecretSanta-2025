-- RUN_THIS_TO_FIX_EVERYTHING.sql
-- Combined fix for Admin Logs and Santa Run feature

-- 1. FIX ADMIN ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'auth', 'game', 'admin', 'system'
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Admins can view all logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert logs" ON public.activity_logs;

CREATE POLICY "Admins can view all logs" ON public.activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "System can insert logs" ON public.activity_logs
    FOR INSERT
    WITH CHECK (true);

-- Helper logging function
CREATE OR REPLACE FUNCTION public.log_activity(p_user_id UUID, p_action_type TEXT, p_details TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action_type, details)
    VALUES (p_user_id, p_action_type, p_details);
END;
$$;


-- 2. ADD SANTA RUN SETTING
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS show_santa_run BOOLEAN DEFAULT false;


-- 3. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
