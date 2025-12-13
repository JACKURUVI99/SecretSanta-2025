-- FIX_ACTIVITY_LOGS.sql
-- Run this in Supabase SQL Editor to enable Admin Logs

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'auth', 'game', 'admin', 'system'
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON public.activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- System/Everyone can insert (for logging actions), but not view
CREATE POLICY "System can insert logs" ON public.activity_logs
    FOR INSERT
    WITH CHECK (true);

-- 4. Helper Function to Log Activity safely from RLS-restricted contexts
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

NOTIFY pgrst, 'reload schema';
