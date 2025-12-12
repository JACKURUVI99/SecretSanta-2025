BEGIN;
CREATE OR REPLACE FUNCTION public.reset_daily_kollywood(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.user_word_progress 
    WHERE user_id = target_user_id 
    AND assigned_at = CURRENT_DATE;
    RETURN TRUE;
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
