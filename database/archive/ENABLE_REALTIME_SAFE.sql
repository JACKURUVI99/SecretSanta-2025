DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Global Chat already enabled';
    END;
    -- 2. Enable Profiles
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Profiles already enabled';
    END;
    -- 3. Enable Tasks
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Tasks already enabled';
    END;
    -- 4. Enable Pairings
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pairings;
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Pairings already enabled';
    END;
END $$;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tictactoe_games;
