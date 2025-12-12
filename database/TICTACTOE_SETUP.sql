CREATE TABLE IF NOT EXISTS public.tictactoe_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_x UUID REFERENCES public.profiles(id) ON DELETE CASCADE, 
    player_o UUID REFERENCES public.profiles(id) ON DELETE CASCADE, 
    board JSONB DEFAULT '[null, null, null, null, null, null, null, null, null]'::jsonb,
    turn UUID REFERENCES public.profiles(id), 
    winner UUID REFERENCES public.profiles(id), 
    is_draw BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tictactoe_players ON public.tictactoe_games(player_x, player_o);
ALTER TABLE public.tictactoe_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own games" ON public.tictactoe_games
    FOR SELECT USING (auth.uid() = player_x OR auth.uid() = player_o);
CREATE POLICY "Users can start games" ON public.tictactoe_games
    FOR INSERT WITH CHECK (auth.uid() = player_x);
CREATE POLICY "Users can update their own games" ON public.tictactoe_games
    FOR UPDATE USING (auth.uid() = player_x OR auth.uid() = player_o);
