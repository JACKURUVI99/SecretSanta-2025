BEGIN;
ALTER TABLE public.word_bank ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Kollywood';
-- Seed Hollywood Words
INSERT INTO public.word_bank (word, hint, category) VALUES
('AVENGERS', 'Superhero Team Up', 'Hollywood'),
('TITANIC', 'Iceberg Ship', 'Hollywood'),
('AVATAR', 'Blue Aliens Pandora', 'Hollywood'),
('INCEPTION', 'Dream within a Dream', 'Hollywood'),
('JOKER', 'Batman Villain Clown', 'Hollywood'),
('MATRIX', 'Red Pill or Blue Pill', 'Hollywood'),
('GLADIATOR', 'Roman General Maximus', 'Hollywood'),
('INTERSTELLAR', 'Black Hole Time Travel', 'Hollywood'),
('GODFATHER', 'Mob Boss Vito Corleone', 'Hollywood'),
('FROZEN', 'Let It Go Elsa', 'Hollywood')
ON CONFLICT (word) DO NOTHING;
-- 2. TIC-TAC-TOE
CREATE TABLE IF NOT EXISTS public.tic_tac_toe_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kid_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    santa_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    board TEXT DEFAULT '_________' NOT NULL,
    turn UUID NOT NULL,
    winner UUID,
    is_draw BOOLEAN DEFAULT FALSE,
    last_move_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(kid_id, santa_id)
);
ALTER TABLE public.tic_tac_toe_games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view game" ON public.tic_tac_toe_games;
CREATE POLICY "Players view game" ON public.tic_tac_toe_games 
FOR SELECT USING (auth.uid() = kid_id OR auth.uid() = santa_id);
DROP POLICY IF EXISTS "Players make move" ON public.tic_tac_toe_games;
CREATE POLICY "Players make move" ON public.tic_tac_toe_games 
FOR UPDATE USING (auth.uid() = kid_id OR auth.uid() = santa_id);
CREATE OR REPLACE FUNCTION public.init_tic_tac_toe(my_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    my_santa_id UUID;
    existing_game RECORD;
BEGIN
    SELECT secret_santa_id INTO my_santa_id FROM public.pairings WHERE user_id = my_id;
    IF my_santa_id IS NULL THEN
        RAISE EXCEPTION 'No Secret Santa assigned yet.';
    END IF;
    SELECT * INTO existing_game FROM public.tic_tac_toe_games WHERE kid_id = my_id AND santa_id = my_santa_id;
    IF existing_game IS NULL THEN
        INSERT INTO public.tic_tac_toe_games (kid_id, santa_id, turn)
        VALUES (my_id, my_santa_id, my_id)
        RETURNING * INTO existing_game;
    END IF;
    RETURN to_jsonb(existing_game);
END;
$$;
CREATE OR REPLACE FUNCTION public.make_move_ttt(game_id UUID, move_pos INT, symbol CHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    game_rec RECORD;
    new_board TEXT;
    next_turn UUID;
    other_player UUID;
BEGIN
    SELECT * INTO game_rec FROM public.tic_tac_toe_games WHERE id = game_id;
    IF game_rec.winner IS NOT NULL OR game_rec.is_draw THEN RAISE EXCEPTION 'Game already over'; END IF;
    IF game_rec.turn != auth.uid() THEN RAISE EXCEPTION 'Not your turn'; END IF;
    IF substr(game_rec.board, move_pos + 1, 1) != '_' THEN RAISE EXCEPTION 'Position taken'; END IF;
    new_board := overlay(game_rec.board placing symbol from move_pos + 1);
    IF auth.uid() = game_rec.kid_id THEN other_player := game_rec.santa_id; ELSE other_player := game_rec.kid_id; END IF;
    next_turn := other_player;
    UPDATE public.tic_tac_toe_games 
    SET board = new_board, turn = next_turn, last_move_at = now()
    WHERE id = game_id
    RETURNING * INTO game_rec;
    RETURN to_jsonb(game_rec);
END;
$$;
-- 3. CO-OP TASKS
CREATE TABLE IF NOT EXISTS public.coop_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kid_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    santa_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_date DATE DEFAULT CURRENT_DATE,
    kid_status TEXT DEFAULT 'pending', 
    santa_status TEXT DEFAULT 'pending',
    points_awarded BOOLEAN DEFAULT FALSE,
    UNIQUE(kid_id, santa_id, task_date)
);
ALTER TABLE public.coop_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View Coop" ON public.coop_actions;
CREATE POLICY "View Coop" ON public.coop_actions FOR SELECT USING (auth.uid() = kid_id OR auth.uid() = santa_id);
CREATE OR REPLACE FUNCTION public.submit_coop_action(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    my_role TEXT;
    my_kid_id UUID;
    my_santa_id UUID;
    current_rec RECORD;
BEGIN
    SELECT secret_santa_id INTO my_santa_id FROM public.pairings WHERE user_id = user_uuid;
    IF my_santa_id IS NOT NULL THEN
        my_kid_id := user_uuid; my_role := 'kid';
    ELSE
        SELECT user_id INTO my_kid_id FROM public.pairings WHERE secret_santa_id = user_uuid;
        IF my_kid_id IS NOT NULL THEN my_santa_id := user_uuid; my_role := 'santa'; ELSE RETURN 'not_paired'; END IF;
    END IF;
    INSERT INTO public.coop_actions (kid_id, santa_id, task_date)
    VALUES (my_kid_id, my_santa_id, CURRENT_DATE)
    ON CONFLICT (kid_id, santa_id, task_date) DO NOTHING;
    IF my_role = 'kid' THEN
        UPDATE public.coop_actions SET kid_status = 'completed' 
        WHERE kid_id = my_kid_id AND santa_id = my_santa_id AND task_date = CURRENT_DATE
        RETURNING * INTO current_rec;
    ELSE
        UPDATE public.coop_actions SET santa_status = 'completed' 
        WHERE kid_id = my_kid_id AND santa_id = my_santa_id AND task_date = CURRENT_DATE
        RETURNING * INTO current_rec;
    END IF;
    IF current_rec.kid_status = 'completed' AND current_rec.santa_status = 'completed' AND current_rec.points_awarded = FALSE THEN
        UPDATE public.profiles SET points = points + 10 WHERE id = my_kid_id;
        UPDATE public.profiles SET points = points + 10 WHERE id = my_santa_id;
        UPDATE public.coop_actions SET points_awarded = TRUE WHERE id = current_rec.id;
        RETURN 'awarded';
    END IF;
    RETURN 'waiting';
END;
$$;
-- 4. ADMIN NEWS FEED
CREATE TABLE IF NOT EXISTS public.news_feed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_pinned BOOLEAN DEFAULT FALSE
);
ALTER TABLE public.news_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read news" ON public.news_feed;
CREATE POLICY "Everyone can read news" ON public.news_feed FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can create news" ON public.news_feed;
CREATE POLICY "Admins can create news" ON public.news_feed FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Admins can update news" ON public.news_feed;
CREATE POLICY "Admins can update news" ON public.news_feed FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Admins can delete news" ON public.news_feed;
CREATE POLICY "Admins can delete news" ON public.news_feed FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
NOTIFY pgrst, 'reload schema';
COMMIT;
