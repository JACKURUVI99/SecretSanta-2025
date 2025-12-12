BEGIN;
CREATE OR REPLACE FUNCTION public.award_tictactoe_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.winner IS NOT NULL AND OLD.winner IS NULL THEN
        UPDATE public.profiles 
        SET points = points + 5 
        WHERE id = NEW.winner;
    END IF;
    IF NEW.is_draw = TRUE AND OLD.is_draw = FALSE THEN
        UPDATE public.profiles 
        SET points = points + 2 
        WHERE id IN (NEW.player_x, NEW.player_o);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_award_tictactoe_points ON public.tictactoe_games;
CREATE TRIGGER trg_award_tictactoe_points
AFTER UPDATE ON public.tictactoe_games
FOR EACH ROW
EXECUTE FUNCTION public.award_tictactoe_points();
CREATE TABLE IF NOT EXISTS public.memory_game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    moves INT NOT NULL, 
    time_taken INT NOT NULL, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.memory_game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all scores" ON public.memory_game_scores FOR SELECT USING (true);
CREATE POLICY "Users can insert own score" ON public.memory_game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.submit_memory_game(p_user_id UUID, p_moves INT, p_time INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today DATE := CURRENT_DATE;
    already_played BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.memory_game_scores 
        WHERE user_id = p_user_id 
        AND created_at::DATE = today
    ) INTO already_played;
    INSERT INTO public.memory_game_scores (user_id, moves, time_taken)
    VALUES (p_user_id, p_moves, p_time);
    IF NOT already_played THEN
        UPDATE public.profiles 
        SET points = points + 10 
        WHERE id = p_user_id;
    END IF;
    RETURN TRUE;
END;
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'show_memory_game') THEN
        ALTER TABLE public.app_settings ADD COLUMN show_memory_game BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
NOTIFY pgrst, 'reload schema';
COMMIT;
