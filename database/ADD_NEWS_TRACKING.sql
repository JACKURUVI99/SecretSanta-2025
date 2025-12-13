-- 1. News Reads Table
CREATE TABLE IF NOT EXISTS public.news_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id UUID REFERENCES public.news_feed(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(news_id, user_id)
);

-- 2. RLS Policies
ALTER TABLE public.news_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own reads" ON public.news_reads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own reads" ON public.news_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all reads" ON public.news_reads FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Reload Schema
NOTIFY pgrst, 'reload schema';
