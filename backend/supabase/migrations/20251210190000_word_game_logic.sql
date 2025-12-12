-- Logic for Assigning Daily Words
-- Ensures user gets 5 unique words per day that they haven't seen before.

CREATE OR REPLACE FUNCTION public.assign_daily_words(target_user_id UUID)
RETURNS TABLE (
    word_id INT,
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
BEGIN
    -- 1. Check how many words assigned today
    SELECT COUNT(*) INTO count_today 
    FROM public.user_word_progress 
    WHERE user_id = target_user_id AND assigned_at = today;

    -- 2. If less than 5, assign more
    IF count_today < 5 THEN
        INSERT INTO public.user_word_progress (user_id, word_id, assigned_at, status)
        SELECT target_user_id, id, today, 'assigned'
        FROM public.word_bank
        WHERE id NOT IN (
            SELECT word_id FROM public.user_word_progress WHERE user_id = target_user_id
        )
        ORDER BY random()
        LIMIT (5 - count_today)
        ON CONFLICT (user_id, word_id) DO NOTHING;
    END IF;

    -- 3. Return the words for today
    RETURN QUERY
    SELECT wb.id, wb.word, wb.hint, uwp.status
    FROM public.user_word_progress uwp
    JOIN public.word_bank wb ON uwp.word_id = wb.id
    WHERE uwp.user_id = target_user_id AND uwp.assigned_at = today;
END;
$$;

-- Function to Solve a Word
CREATE OR REPLACE FUNCTION public.solve_word(target_user_id UUID, target_word_id INT, guess TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    correct_word TEXT;
    already_solved BOOLEAN;
BEGIN
    -- Get the correct word
    SELECT word INTO correct_word FROM public.word_bank WHERE id = target_word_id;
    
    -- Check if already solved
    SELECT (status = 'solved') INTO already_solved 
    FROM public.user_word_progress 
    WHERE user_id = target_user_id AND word_id = target_word_id;

    IF already_solved THEN
        RETURN TRUE;
    END IF;

    -- Validate Guess (Case Insensitive)
    IF UPPER(TRIM(guess)) = UPPER(correct_word) THEN
        -- Mark Solved
        UPDATE public.user_word_progress 
        SET status = 'solved' 
        WHERE user_id = target_user_id AND word_id = target_word_id;

        -- Award Points (e.g. 20 pts)
        UPDATE public.profiles 
        SET points = points + 20 
        WHERE id = target_user_id;

        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;
