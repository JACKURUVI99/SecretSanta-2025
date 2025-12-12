BEGIN;
DROP FUNCTION IF EXISTS public.assign_daily_words(UUID);
CREATE OR REPLACE FUNCTION public.assign_daily_words(target_user_id UUID)
RETURNS TABLE (ret_word_id INT, ret_word TEXT, ret_hint TEXT, ret_status TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today DATE := CURRENT_DATE;
    count_today INT;
    words_to_assign INT;
    new_word RECORD;
    word_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO count_today 
    FROM public.user_word_progress 
    WHERE user_word_progress.user_id = target_user_id 
    AND user_word_progress.assigned_at = today;
    words_to_assign := 5 - count_today;
    IF words_to_assign > 0 THEN
        FOR new_word IN (
            SELECT wb.id AS bank_id
            FROM public.word_bank wb
            WHERE wb.id NOT IN (
                SELECT uwp.word_id 
                FROM public.user_word_progress uwp 
                WHERE uwp.user_id = target_user_id
            )
            ORDER BY random() 
            LIMIT words_to_assign
        ) LOOP
            SELECT EXISTS(
                SELECT 1 FROM public.user_word_progress 
                WHERE user_word_progress.user_id = target_user_id 
                AND user_word_progress.word_id = new_word.bank_id
            ) INTO word_exists;
            IF NOT word_exists THEN
                INSERT INTO public.user_word_progress (user_id, word_id, assigned_at, status)
                VALUES (target_user_id, new_word.bank_id, today, 'assigned');
            END IF;
        END LOOP;
    END IF;
    -- 3. Return the words for today
    RETURN QUERY
    SELECT wb.id::INT, wb.word, wb.hint, uwp.status
    FROM public.user_word_progress uwp
    JOIN public.word_bank wb ON uwp.word_id = wb.id
    WHERE uwp.user_id = target_user_id 
    AND uwp.assigned_at = today;
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT * FROM public.assign_daily_words(
    (SELECT id FROM public.profiles WHERE is_admin = FALSE LIMIT 1)
);
