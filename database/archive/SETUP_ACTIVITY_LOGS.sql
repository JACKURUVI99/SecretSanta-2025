BEGIN;
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, 
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read all logs" ON public.activity_logs;
CREATE POLICY "Admins read all logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (public.check_is_admin());
DROP POLICY IF EXISTS "Users insert own logs" ON public.activity_logs;
CREATE POLICY "Users insert own logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.log_activity(
    p_action_type TEXT,
    p_description TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action_type, description)
    VALUES (auth.uid(), p_action_type, p_description);
    UPDATE public.profiles
    SET last_seen = NOW()
    WHERE id = auth.uid();
END;
$$;
CREATE OR REPLACE FUNCTION public.update_presence()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET last_seen = NOW()
    WHERE id = auth.uid();
END;
$$;
COMMIT;
