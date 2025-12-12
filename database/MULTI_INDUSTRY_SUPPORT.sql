BEGIN;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'word_bank' AND column_name = 'category') THEN
        ALTER TABLE public.word_bank ADD COLUMN category TEXT DEFAULT 'Kollywood';
    END IF;
END $$;
-- 2. Create updated RPC that accepts category
-- Note: We are OVERLOADING or REPLACING the function. 
-- Since we are changing signature, we might need to DROP the old one if we want to force the new one, 
-- or we can keep the old one as a wrapper. For cleanliness, let's redefine it.
DROP FUNCTION IF EXISTS public.assign_daily_words(UUID);
CREATE OR REPLACE FUNCTION public.assign_daily_words(target_user_id UUID, target_category TEXT DEFAULT 'Kollywood')
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
    -- 1. Check how many words assigned today FOR THIS CATEGORY
    -- We need to join with word_bank to check category of assigned words
    SELECT COUNT(*) INTO count_today 
    FROM public.user_word_progress uwp
    JOIN public.word_bank wb ON uwp.word_id = wb.id
    WHERE uwp.user_id = target_user_id 
    AND uwp.assigned_at = today
    AND wb.category = target_category;
    -- 2. If less than 5, assign more
    IF count_today < 5 THEN
        INSERT INTO public.user_word_progress (user_id, word_id, assigned_at, status)
        SELECT target_user_id, id, today, 'assigned'
        FROM public.word_bank
        WHERE category = target_category
        AND id NOT IN (
            SELECT word_id FROM public.user_word_progress WHERE user_id = target_user_id
        )
        ORDER BY random()
        LIMIT (5 - count_today)
        ON CONFLICT (user_id, word_id) DO NOTHING;
    END IF;
    -- 3. Return the words for today (filtered by category)
    RETURN QUERY
    SELECT wb.id, wb.word, wb.hint, uwp.status
    FROM public.user_word_progress uwp
    JOIN public.word_bank wb ON uwp.word_id = wb.id
    WHERE uwp.user_id = target_user_id 
    AND uwp.assigned_at = today
    AND wb.category = target_category;
END;
$$;
-- 3. Seed basic data for new categories (so tabs aren't empty)
INSERT INTO public.word_bank (word, hint, category) VALUES
-- Hollywood
('AVENGERS', 'Earths Mightiest Heroes', 'Hollywood'),
('TITANIC', 'Near, far, wherever you are', 'Hollywood'),
('INCEPTION', 'Dreams within dreams', 'Hollywood'),
('JURASSIC PARK', 'Dinosaurs rule the earth', 'Hollywood'),
('THE MATRIX', 'Red pill or blue pill', 'Hollywood'),
-- Mollywood (Malayalam)
('DRISHYAM', 'Georgekutty and his family', 'Mollywood'),
('PREMAM', 'Three stages of love', 'Mollywood'),
('MANICHITRATHAZHU', 'Nagavalli is watching', 'Mollywood'),
('BANGALORE DAYS', 'Cousins trip', 'Mollywood'),
('LUCIFER', 'Stephen Nedumpally', 'Mollywood'),
-- Tollywood (Telugu)
('BAAHUBALI', 'Why did Katappa kill him?', 'Tollywood'),
('RRR', 'Fire and Water friendship', 'Tollywood'),
('ARJUN REDDY', 'Intense medical student love', 'Tollywood'),
('MAGADHEERA', 'Reincarnation love story', 'Tollywood'),
('PUSHPA', 'Thaggedhe Le', 'Tollywood'),
-- Bollywood (Hindi)
('DDLJ', 'Bade bade deshon mein', 'Bollywood'),
('SHOLAY', 'Yeh haath mujhe de de Thakur', 'Bollywood'),
('3 IDIOTS', 'All is Well', 'Bollywood'),
('DANGAL', 'Wrestling sisters', 'Bollywood'),
('LAGAAN', 'Cricket match taxes', 'Bollywood')
ON CONFLICT DO NOTHING;
NOTIFY pgrst, 'reload schema';
COMMIT;
