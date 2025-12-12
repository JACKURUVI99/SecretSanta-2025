-- FIX WORD RESET RPC
-- The user reported this function is missing.

CREATE OR REPLACE FUNCTION public.reset_all_user_daily_words()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete all progress for CURRENT DATE
    DELETE FROM public.user_word_progress 
    WHERE assigned_at = CURRENT_DATE;
END;
$$;

-- Grant execution to authenticated users (so admins can call it)
GRANT EXECUTE ON FUNCTION public.reset_all_user_daily_words TO authenticated;

-- Ensure schema reload
NOTIFY pgrst, 'reload schema';
