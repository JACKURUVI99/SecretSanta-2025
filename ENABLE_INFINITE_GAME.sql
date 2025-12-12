-- FIX V3: Added DROP FUNCTION to allow changing return type signature.

DROP FUNCTION IF EXISTS public.assign_daily_words(uuid, text);

CREATE OR REPLACE FUNCTION public.assign_daily_words(target_user_id UUID, target_category TEXT DEFAULT 'Kollywood')
RETURNS TABLE (
    out_word_id INT, -- RENAMED FROM word_id
    word TEXT,
    hint TEXT,
    status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today DATE := CURRENT_DATE;
    count_today INT;
    v_available_count INT;
BEGIN
    -- 1. Check how many words assigned TODAY
    SELECT COUNT(*) INTO count_today 
    FROM public.user_word_progress uwp
    JOIN public.word_bank wb ON uwp.word_id = wb.id
    WHERE uwp.user_id = target_user_id 
    AND uwp.assigned_at = today
    AND wb.category = target_category;

    -- 2. If user needs more words (less than 5 assigned today)
    IF count_today < 5 THEN
        
        -- CHECK: Are there enough unplayed words left?
        SELECT COUNT(*) INTO v_available_count
        FROM public.word_bank wb
        WHERE wb.category = target_category
        AND wb.id NOT IN (
            SELECT uwp.word_id 
            FROM public.user_word_progress uwp 
            WHERE uwp.user_id = target_user_id
        );

        -- RECYCLE LOGIC: If we don't have enough unplayed words to fill the quota...
        -- We RESET the user's history for this category (excluding today's words)
        IF v_available_count < (5 - count_today) THEN
            DELETE FROM public.user_word_progress uwp_del
            WHERE uwp_del.user_id = target_user_id 
            AND uwp_del.assigned_at != today 
            AND uwp_del.word_id IN (SELECT wb_inner.id FROM public.word_bank wb_inner WHERE wb_inner.category = target_category);
        END IF;

        -- 3. Now assign words (Standard Logic)
        INSERT INTO public.user_word_progress (user_id, word_id, assigned_at, status)
        SELECT target_user_id, wb.id, today, 'assigned'
        FROM public.word_bank wb
        WHERE wb.category = target_category
        AND wb.id NOT IN (
            SELECT uwp_check.word_id FROM public.user_word_progress uwp_check WHERE uwp_check.user_id = target_user_id
        )
        ORDER BY random()
        LIMIT (5 - count_today)
        ON CONFLICT (user_id, word_id) DO NOTHING; 
        -- Note: word_id here is strictly the column name in ON CONFLICT, 
        -- but since we renamed our variable to out_word_id, there is no collision now!
        
    END IF;

    -- 4. Return the words for today
    RETURN QUERY
    SELECT wb.id AS out_word_id, wb.word, wb.hint, uwp.status
    FROM public.user_word_progress uwp
    JOIN public.word_bank wb ON uwp.word_id = wb.id
    WHERE uwp.user_id = target_user_id 
    AND uwp.assigned_at = today
    AND wb.category = target_category;
END;
$$;

NOTIFY pgrst, 'reload schema';
