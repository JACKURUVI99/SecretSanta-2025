-- Create News Reads Table if not exists
CREATE TABLE IF NOT EXISTS public.news_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id UUID REFERENCES public.news_feed(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(news_id, user_id)
);

-- Enable RLS
ALTER TABLE public.news_reads ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own reads" ON public.news_reads;
CREATE POLICY "Users can view own reads" ON public.news_reads FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark read" ON public.news_reads;
CREATE POLICY "Users can mark read" ON public.news_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure Activity Logs exists too (for the other task)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_username TEXT,
    action TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view logs" ON public.activity_logs;
CREATE POLICY "Admins can view logs" ON public.activity_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Service Role can insert logs" ON public.activity_logs;
CREATE POLICY "Service Role can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (true);
