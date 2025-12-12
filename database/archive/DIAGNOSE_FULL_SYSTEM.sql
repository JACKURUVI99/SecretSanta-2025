SELECT 
    count(*) as total_users,
    count(*) filter (where is_admin = true) as total_admins,
    avg(points) as average_points,
    sum(points) as total_points_in_system
FROM public.profiles;
SELECT id, name, roll_number, points, is_admin 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;
SELECT * FROM public.app_settings;
SELECT id, title, is_pinned, created_at 
FROM public.news_feed 
ORDER BY created_at DESC 
LIMIT 5;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'news_feed', 'app_settings');
-- 5. LIST ACTIVE POLICIES
-- See exactly what rules are blocking/allowing access
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('profiles', 'news_feed', 'app_settings');
-- =================================================================
-- INTERPRETATION:
-- 1. If 'total_users' is 0 -> DATA WAS WIPED. You need to re-login to create profiles.
-- 2. If 'points' are all 0 -> POINTS fueron WIPED or never assigned.
-- 3. If 'app_settings' is empty -> Run the 'PHASE_2_SETUP.sql' or 'COMPLETE_DB_SETUP.sql'.
-- 4. If RLS is TRUE but no policies listed -> NO ONE CAN SEE DATA. Run 'UNLOCK_DATABASE_NOW.sql'.
