BEGIN;
CREATE TABLE IF NOT EXISTS public.daily_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    checkin_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, checkin_date)
);
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can check in themselves" ON public.daily_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Everyone can view checkins" ON public.daily_checkins
    FOR SELECT USING (true);
CREATE TABLE IF NOT EXISTS public.game_canvas_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_date DATE DEFAULT CURRENT_DATE UNIQUE,
    canvas_data JSONB DEFAULT '{}', 
    last_updated_by UUID REFERENCES public.profiles(id),
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.game_canvas_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view canvas" ON public.game_canvas_state
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update canvas" ON public.game_canvas_state
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert canvas" ON public.game_canvas_state
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE TABLE IF NOT EXISTS public.game_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.game_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can react" ON public.game_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view reactions" ON public.game_reactions
    FOR SELECT USING (auth.role() = 'authenticated');
COMMIT;
