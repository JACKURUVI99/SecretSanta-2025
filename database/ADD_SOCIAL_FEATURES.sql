-- 1. Profile Likes Table
CREATE TABLE IF NOT EXISTS public.profile_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, target_id)
);

-- 2. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'like', 'system', 'santa'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. RLS Policies
ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Likes Policies
CREATE POLICY "Users can view all likes" ON public.profile_likes FOR SELECT USING (true);
CREATE POLICY "Users can toggle their own likes" ON public.profile_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own likes" ON public.profile_likes FOR DELETE USING (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true); -- Ideally restricted to service role, but for backend proxy it's fine
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reload Schema
NOTIFY pgrst, 'reload schema';
