BEGIN;
CREATE TABLE IF NOT EXISTS public.daily_game_completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL, 
    completion_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id, completion_date)
);
ALTER TABLE public.daily_game_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own completions"
ON public.daily_game_completions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions"
ON public.daily_game_completions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.mark_game_completed(p_game_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.daily_game_completions (user_id, game_id, completion_date)
    VALUES (auth.uid(), p_game_id, CURRENT_DATE)
    ON CONFLICT (user_id, game_id, completion_date) DO NOTHING;
END;
$$;
CREATE OR REPLACE FUNCTION public.get_completed_games()
RETURNS TABLE (game_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT d.game_id
    FROM public.daily_game_completions d
    WHERE d.user_id = auth.uid()
    AND d.completion_date = CURRENT_DATE;
END;
$$;
COMMIT;
