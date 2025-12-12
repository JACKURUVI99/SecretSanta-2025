BEGIN;
DO $$
DECLARE
    word_count INT;
BEGIN
    SELECT COUNT(*) INTO word_count FROM public.word_bank;
    RAISE NOTICE 'Word bank has % words', word_count;
    IF word_count = 0 THEN
        RAISE NOTICE 'Word bank is empty! Inserting words now...';
        -- Insert Kollywood words
        INSERT INTO public.word_bank (word, hint, category) VALUES
        ('VIKRAM', 'Kamal Haasan Action Message', 'Kollywood'),
        ('LEO', 'Vijay LCU Movie', 'Kollywood'),
        ('KAITHI', 'Karthi Lorry Scene', 'Kollywood'),
        ('MASTER', 'JD vs Bhavani', 'Kollywood'),
        ('THUPPAKKI', 'Jagdish in Mumbai', 'Kollywood'),
        ('GHILLI', 'Kabaddi Match', 'Kollywood'),
        ('BAASHA', 'Auto Driver Manikandan', 'Kollywood'),
        ('PADAYAPPA', 'Neelambari Challenge', 'Kollywood'),
        ('ANNIYAN', 'Multiple Personnel Disorder', 'Kollywood'),
        ('SIVAJI', 'Motton Boss', 'Kollywood'),
        ('ENTHIRAN', 'Chitti the Robot', 'Kollywood'),
        ('MINNALE', 'Madhavan Love Story', 'Kollywood'),
        ('VARNAM', 'Gowtham Menon Classic', 'Kollywood'),
        ('ALAIPAYUTHEY', 'Shalini Train Scene', 'Kollywood'),
        ('KANDUKONDAIN', 'Tabu & Aishwarya', 'Kollywood'),
        ('AYAN', 'Smuggling Diamonds', 'Kollywood'),
        ('KO', 'Photo Journalist Cameraman', 'Kollywood'),
        ('MANKATHA', 'Vinayak Mahadevan Money', 'Kollywood'),
        ('ARAMBAM', 'Ajith Hacking', 'Kollywood'),
        ('VADACHENNAI', 'Carrom Board North Madras', 'Kollywood'),
        ('ASURAN', 'Sivasamy Farmer Fight', 'Kollywood'),
        ('KARNAN', 'Sword Fish Symbol', 'Kollywood'),
        ('PARIYERUM', 'Law College Dog', 'Kollywood'),
        ('SARPATTA', 'Boxing Clans 70s', 'Kollywood'),
        ('JIGARTHANDA', 'Gangster Making Movie', 'Kollywood'),
        ('SOODHU', 'Kidnap Drama Comedy', 'Kollywood'),
        ('PIZZA', 'Delivery Boy Horror', 'Kollywood'),
        ('RATSASAN', 'Psycho Killer Doll', 'Kollywood'),
        ('THANI', 'Oruvan Jayam Ravi', 'Kollywood'),
        ('COMALI', '90s Kid Coma Loop', 'Kollywood'),
        -- Hollywood words
        ('AVENGERS', 'Superhero Team Up', 'Hollywood'),
        ('TITANIC', 'Iceberg Ship', 'Hollywood'),
        ('AVATAR', 'Blue Aliens Pandora', 'Hollywood'),
        ('INCEPTION', 'Dream within a Dream', 'Hollywood'),
        ('JOKER', 'Batman Villain Clown', 'Hollywood'),
        ('MATRIX', 'Red Pill or Blue Pill', 'Hollywood'),
        ('GLADIATOR', 'Roman General Maximus', 'Hollywood'),
        ('INTERSTELLAR', 'Black Hole Time Travel', 'Hollywood'),
        ('GODFATHER', 'Mob Boss Vito Corleone', 'Hollywood'),
        ('FROZEN', 'Let It Go Elsa', 'Hollywood')
        ON CONFLICT (word) DO NOTHING;
        RAISE NOTICE 'Words inserted successfully!';
    END IF;
END $$;
-- 2. Check if assign_daily_words function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'assign_daily_words'
    ) THEN
        RAISE EXCEPTION 'Function assign_daily_words does not exist! Run PHASE_3_SETUP.sql';
    ELSE
        RAISE NOTICE 'Function assign_daily_words exists ✓';
    END IF;
END $$;
-- 3. Check if solve_word function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'solve_word'
    ) THEN
        RAISE EXCEPTION 'Function solve_word does not exist! Run PHASE_3_SETUP.sql';
    ELSE
        RAISE NOTICE 'Function solve_word exists ✓';
    END IF;
END $$;
-- 4. Check RLS policies
DO $$
DECLARE
    policy_count INT;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'word_bank';
    IF policy_count = 0 THEN
        RAISE WARNING 'No RLS policies found for word_bank!';
    ELSE
        RAISE NOTICE 'Word bank has % RLS policies ✓', policy_count;
    END IF;
END $$;
-- 5. Test the assign_daily_words function with a sample user
-- (This will show if there are any runtime errors)
DO $$
DECLARE
    test_user_id UUID;
    result_count INT;
BEGIN
    -- Get first non-admin user
    SELECT id INTO test_user_id 
    FROM public.profiles 
    WHERE is_admin = FALSE 
    LIMIT 1;
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing assign_daily_words for user: %', test_user_id;
        -- This will assign words if not already assigned
        PERFORM public.assign_daily_words(test_user_id);
        -- Check if words were assigned
        SELECT COUNT(*) INTO result_count
        FROM public.user_word_progress
        WHERE user_id = test_user_id AND assigned_at = CURRENT_DATE;
        RAISE NOTICE 'User has % words assigned for today', result_count;
    ELSE
        RAISE NOTICE 'No non-admin users found to test with';
    END IF;
END $$;
COMMIT;
-- Final summary
SELECT 
    'Word Bank' as table_name,
    COUNT(*) as row_count
FROM public.word_bank
UNION ALL
SELECT 
    'User Word Progress' as table_name,
    COUNT(*) as row_count
FROM public.user_word_progress;
