-- 1. Force add status column if it's missing (Primary Cause of 500 Error)
ALTER TABLE public.tictactoe_games ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Force add winner/board column if missing
ALTER TABLE public.tictactoe_games ADD COLUMN IF NOT EXISTS winner UUID REFERENCES public.profiles(id);
ALTER TABLE public.tictactoe_games ADD COLUMN IF NOT EXISTS board JSONB DEFAULT '[null,null,null,null,null,null,null,null,null]';

-- 3. Reload Schema Cache (Critical for Supabase to see the new columns)
NOTIFY pgrst, 'reload schema';

-- 4. Verify/Re-apply RLS policies just in case
ALTER TABLE public.tictactoe_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View games involving user" ON public.tictactoe_games;
CREATE POLICY "View games involving user" ON public.tictactoe_games
    FOR SELECT USING (auth.uid() = player_x OR auth.uid() = player_o);

DROP POLICY IF EXISTS "Update game state" ON public.tictactoe_games;
CREATE POLICY "Update game state" ON public.tictactoe_games
    FOR UPDATE USING (auth.uid() = player_x OR auth.uid() = player_o);

DROP POLICY IF EXISTS "Create game" ON public.tictactoe_games;
CREATE POLICY "Create game" ON public.tictactoe_games
    FOR INSERT WITH CHECK (auth.uid() = player_x);
