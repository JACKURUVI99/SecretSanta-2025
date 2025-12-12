BEGIN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS public.global_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read global messages" ON public.global_messages;
CREATE POLICY "Everyone can read global messages" ON public.global_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can post messages" ON public.global_messages;
CREATE POLICY "Authenticated users can post messages" ON public.global_messages FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true
    )
);
DROP POLICY IF EXISTS "Admins can delete messages" ON public.global_messages;
CREATE POLICY "Admins can delete messages" ON public.global_messages FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    )
);
CREATE TABLE IF NOT EXISTS public.profile_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, target_id)
);
ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view likes" ON public.profile_likes;
CREATE POLICY "Everyone can view likes" ON public.profile_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can like profiles" ON public.profile_likes;
CREATE POLICY "Users can like profiles" ON public.profile_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike" ON public.profile_likes;
CREATE POLICY "Users can unlike" ON public.profile_likes FOR DELETE USING (auth.uid() = user_id);
CREATE TABLE IF NOT EXISTS public.daily_logins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    login_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, login_date)
);
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.handle_daily_login(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today DATE := CURRENT_DATE;
    already_logged_in BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.daily_logins WHERE user_id = user_uuid AND login_date = today) INTO already_logged_in;
    IF already_logged_in THEN
        RETURN FALSE;
    END IF;
    INSERT INTO public.daily_logins (user_id, login_date) VALUES (user_uuid, today);
    UPDATE public.profiles SET points = points + 10 WHERE id = user_uuid;
    RETURN TRUE;
END;
$$;
DROP POLICY IF EXISTS "Users view own logins" ON public.daily_logins;
CREATE POLICY "Users view own logins" ON public.daily_logins FOR SELECT USING (auth.uid() = user_id);
CREATE TABLE IF NOT EXISTS public.word_bank (
    id SERIAL PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    hint TEXT NOT NULL,
    points INTEGER DEFAULT 20
);
ALTER TABLE public.word_bank ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read words" ON public.word_bank;
CREATE POLICY "Everyone can read words" ON public.word_bank FOR SELECT USING (true);
CREATE TABLE IF NOT EXISTS public.user_word_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    word_id INTEGER REFERENCES public.word_bank(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'assigned', 
    assigned_at DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, word_id) 
);
ALTER TABLE public.user_word_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own progress" ON public.user_word_progress;
CREATE POLICY "Users view own progress" ON public.user_word_progress FOR SELECT USING (auth.uid() = user_id);
INSERT INTO public.word_bank (word, hint) VALUES
('VIKRAM', 'Kamal Haasan Action Message'),
('LEO', 'Vijay LCU Movie'),
('KAITHI', 'Karthi Lorry Scene'),
('MASTER', 'JD vs Bhavani'),
('THUPPAKKI', 'Jagdish in Mumbai'),
('GHILLI', 'Kabaddi Match'),
('BAASHA', 'Auto Driver Manikandan'),
('PADAYAPPA', 'Neelambari Challenge'),
('ANNIYAN', 'Multiple Personnel Disorder'),
('SIVAJI', 'Motton Boss'),
('ENTHIRAN', 'Chitti the Robot'),
('MINNALE', 'Madhavan Love Story'),
('VARNAM', 'Gowtham Menon Classic'),
('ALAIPAYUTHEY', 'Shalini Train Scene'),
('KANDUKONDAIN', 'Tabu & Aishwarya'),
('AYAN', 'Smuggling Diamonds'),
('KO', 'Photo Journalist Cameraman'),
('MANKATHA', 'Vinayak Mahadevan Money'),
('ARAMBAM', 'Ajith Hacking'),
('VADACHENNAI', 'Carrom Board North Madras'),
('ASURAN', 'Sivasamy Farmer Fight'),
('KARNAN', 'Sword Fish Symbol'),
('PARIYERUM', 'Law College Dog'),
('SARPATTA', 'Boxing Clans 70s'),
('JIGARTHANDA', 'Gangster Making Movie'),
('SOODHU', 'Kidnap Drama Comedy'),
('PIZZA', 'Delivery Boy Horror'),
('RATSASAN', 'Psycho Killer Doll'),
('THANI', 'Oruvan Jayam Ravi'),
('COMALI', '90s Kid Coma Loop')
ON CONFLICT (word) DO NOTHING;
-- Reload Schema
NOTIFY pgrst, 'reload schema';
COMMIT;
