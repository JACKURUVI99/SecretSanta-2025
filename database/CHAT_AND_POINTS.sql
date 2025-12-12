CREATE TABLE IF NOT EXISTS public.global_chat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (char_length(message) <= 500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.global_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view chat" ON public.global_chat
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post chat" ON public.global_chat
    FOR INSERT WITH CHECK (auth.uid() = user_id);
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS show_tictactoe BOOLEAN DEFAULT TRUE;
CREATE OR REPLACE FUNCTION award_tictactoe_points() 
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.winner IS NULL AND OLD.is_draw = FALSE) AND 
       (NEW.winner IS NOT NULL OR NEW.is_draw = TRUE) THEN
       UPDATE public.profiles 
       SET points = points + 2 
       WHERE id = NEW.player_x;
       UPDATE public.profiles 
       SET points = points + 2 
       WHERE id = NEW.player_o;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trigger_award_tictactoe_points ON public.tictactoe_games;
CREATE TRIGGER trigger_award_tictactoe_points
AFTER UPDATE ON public.tictactoe_games
FOR EACH ROW
EXECUTE FUNCTION award_tictactoe_points();
