-- 1. Add Banned Status to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- 2. Ensure TicTacToe Games Table Exists & Correct
CREATE TABLE IF NOT EXISTS public.tictactoe_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    player_x UUID REFERENCES public.profiles(id) NOT NULL,
    player_o UUID REFERENCES public.profiles(id) NOT NULL,
    turn UUID REFERENCES public.profiles(id) NOT NULL,
    board JSONB NOT NULL DEFAULT '[null,null,null,null,null,null,null,null,null]'::jsonb,
    winner UUID REFERENCES public.profiles(id),
    is_draw BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'finished'))
);

-- 3. Fix RLS for TicTacToe
ALTER TABLE public.tictactoe_games ENABLE ROW LEVEL SECURITY;

-- Allow Users to Read Games they are in
DROP POLICY IF EXISTS "Users can view their games" ON public.tictactoe_games;
CREATE POLICY "Users can view their games" ON public.tictactoe_games
    FOR SELECT USING (auth.uid() = player_x OR auth.uid() = player_o);

-- Allow Users to Insert Games (must be one of the players)
DROP POLICY IF EXISTS "Users can create games" ON public.tictactoe_games;
CREATE POLICY "Users can create games" ON public.tictactoe_games
    FOR INSERT WITH CHECK (auth.uid() = player_x OR auth.uid() = player_o);

-- Allow Users to Update Games they are in (making moves)
DROP POLICY IF EXISTS "Users can update their games" ON public.tictactoe_games;
CREATE POLICY "Users can update their games" ON public.tictactoe_games
    FOR UPDATE USING (auth.uid() = player_x OR auth.uid() = player_o);

-- 4. Fix User Tasks permission just in case
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tasks" ON public.user_tasks;
CREATE POLICY "Users can view own tasks" ON public.user_tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tasks" ON public.user_tasks;
CREATE POLICY "Users can update own tasks" ON public.user_tasks FOR UPDATE USING (auth.uid() = user_id);
-- Allow service role full access by default (Supabase default usually covers this)

-- 5. Grant Permissions to Authenticated
GRANT ALL ON public.tictactoe_games TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
