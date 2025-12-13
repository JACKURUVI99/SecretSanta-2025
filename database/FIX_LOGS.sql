-- Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    action_type TEXT NOT NULL, -- 'admin', 'auth', 'game', 'system'
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all logs
CREATE POLICY "Admins can view logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
        )
    );

-- Policy: System/Server can insert logs (or authenticated users for their actions)
CREATE POLICY "Insert logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT SELECT, INSERT ON public.activity_logs TO service_role;
