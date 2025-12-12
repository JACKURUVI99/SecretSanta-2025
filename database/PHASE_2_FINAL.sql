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
    auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
);
DROP POLICY IF EXISTS "Admins can delete messages" ON public.global_messages;
CREATE POLICY "Admins can delete messages" ON public.global_messages FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
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
DROP POLICY IF EXISTS "Users view own logins" ON public.daily_logins;
CREATE POLICY "Users view own logins" ON public.daily_logins FOR SELECT USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.handle_daily_login(user_uuid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    today DATE := CURRENT_DATE;
    already_logged_in BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.daily_logins WHERE user_id = user_uuid AND login_date = today) INTO already_logged_in;
    IF already_logged_in THEN RETURN FALSE; END IF;
    INSERT INTO public.daily_logins (user_id, login_date) VALUES (user_uuid, today);
    UPDATE public.profiles SET points = points + 10 WHERE id = user_uuid;
    RETURN TRUE;
END;
$$;
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
CREATE OR REPLACE FUNCTION public.assign_daily_words(target_user_id UUID)
RETURNS TABLE (word_id INT, word TEXT, hint TEXT, status TEXT) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    today DATE := CURRENT_DATE;
    count_today INT;
BEGIN
    SELECT COUNT(*) INTO count_today FROM public.user_word_progress WHERE user_id = target_user_id AND assigned_at = today;
    IF count_today < 5 THEN
        INSERT INTO public.user_word_progress (user_id, word_id, assigned_at, status)
        SELECT target_user_id, id, today, 'assigned'
        FROM public.word_bank
        WHERE id NOT IN (SELECT word_id FROM public.user_word_progress WHERE user_id = target_user_id)
        ORDER BY random() LIMIT (5 - count_today)
        ON CONFLICT (user_id, word_id) DO NOTHING;
    END IF;
    RETURN QUERY
    SELECT wb.id, wb.word, wb.hint, uwp.status
    FROM public.user_word_progress uwp
    JOIN public.word_bank wb ON uwp.word_id = wb.id
    WHERE uwp.user_id = target_user_id AND uwp.assigned_at = today;
END;
$$;
CREATE OR REPLACE FUNCTION public.solve_word(target_user_id UUID, target_word_id INT, guess TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    correct_word TEXT;
    already_solved BOOLEAN;
BEGIN
    SELECT word INTO correct_word FROM public.word_bank WHERE id = target_word_id;
    SELECT (status = 'solved') INTO already_solved FROM public.user_word_progress WHERE user_id = target_user_id AND word_id = target_word_id;
    IF already_solved THEN RETURN TRUE; END IF;
    IF UPPER(TRIM(guess)) = UPPER(correct_word) THEN
        UPDATE public.user_word_progress SET status = 'solved' WHERE user_id = target_user_id AND word_id = target_word_id;
        UPDATE public.profiles SET points = points + 20 WHERE id = target_user_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;
-- 7. SEED WORD BANK
INSERT INTO public.word_bank (word, hint) VALUES
('VIKRAM', 'Kamal Haasan Action Message'), ('LEO', 'Vijay LCU Movie'), ('KAITHI', 'Karthi Lorry Scene'), ('MASTER', 'JD vs Bhavani'), ('THUPPAKKI', 'Jagdish in Mumbai'), ('GHILLI', 'Kabaddi Match'), ('BAASHA', 'Auto Driver Manikandan'), ('PADAYAPPA', 'Neelambari Challenge'), ('ANNIYAN', 'Multiple Personnel Disorder'), ('SIVAJI', 'Motton Boss'), ('ENTHIRAN', 'Chitti the Robot'), ('MINNALE', 'Madhavan Love Story'), ('VARNAM', 'Gowtham Menon Classic'), ('ALAIPAYUTHEY', 'Shalini Train Scene'), ('KANDUKONDAIN', 'Tabu & Aishwarya'), ('AYAN', 'Smuggling Diamonds'), ('KO', 'Photo Journalist Cameraman'), ('MANKATHA', 'Vinayak Mahadevan Money'), ('ARAMBAM', 'Ajith Hacking'), ('VADACHENNAI', 'Carrom Board North Madras'), ('ASURAN', 'Sivasamy Farmer Fight'), ('KARNAN', 'Sword Fish Symbol'), ('PARIYERUM', 'Law College Dog'), ('SARPATTA', 'Boxing Clans 70s'), ('JIGARTHANDA', 'Gangster Making Movie'), ('SOODHU', 'Kidnap Drama Comedy'), ('PIZZA', 'Delivery Boy Horror'), ('RATSASAN', 'Psycho Killer Doll'), ('THANI', 'Oruvan Jayam Ravi'), ('COMALI', '90s Kid Coma Loop')
ON CONFLICT (word) DO NOTHING;
NOTIFY pgrst, 'reload schema';
COMMIT;
