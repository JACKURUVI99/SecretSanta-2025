-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tictactoe_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_feed ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES
-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Performance Tip: use (select auth.uid()) to cache the result per statement
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id);

-- 2. TASKS (Read Only for Users)
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON tasks;
CREATE POLICY "Tasks are viewable by everyone" 
ON tasks FOR SELECT TO authenticated USING (true);

-- 3. USER TASKS (User's private progress)
DROP POLICY IF EXISTS "Users can manage their own task progress" ON user_tasks;
CREATE POLICY "Users can manage their own task progress" 
ON user_tasks FOR ALL TO authenticated USING ((select auth.uid()) = user_id);

-- 4. PAIRINGS (Private - only see your Santa or your Giftee)
DROP POLICY IF EXISTS "Users can see their own pairings" ON pairings;
CREATE POLICY "Users can see their own pairings" 
ON pairings FOR SELECT TO authenticated 
USING ((select auth.uid()) = user_id OR (select auth.uid()) = secret_santa_id);

-- 5. APP SETTINGS (Read Only)
DROP POLICY IF EXISTS "Settings viewable by everyone" ON app_settings;
CREATE POLICY "Settings viewable by everyone" 
ON app_settings FOR SELECT TO authenticated USING (true);

-- 6. WORD BANK (Read Only)
DROP POLICY IF EXISTS "Word bank viewable by everyone" ON word_bank;
CREATE POLICY "Word bank viewable by everyone" 
ON word_bank FOR SELECT TO authenticated USING (true);

-- 7. USER WORD PROGRESS
DROP POLICY IF EXISTS "Users can manage their word progress" ON user_word_progress;
CREATE POLICY "Users can manage their word progress" 
ON user_word_progress FOR ALL TO authenticated USING ((select auth.uid()) = user_id);

-- 8. TICTACTOE GAMES
DROP POLICY IF EXISTS "Users can play their games" ON tictactoe_games;
CREATE POLICY "Users can play their games" 
ON tictactoe_games FOR ALL TO authenticated 
USING ((select auth.uid()) = player_x OR (select auth.uid()) = player_o);

-- 9. MEMORY GAME SCORES
DROP POLICY IF EXISTS "Users can submit their memory scores" ON memory_game_scores;
CREATE POLICY "Users can submit their memory scores" 
ON memory_game_scores FOR ALL TO authenticated USING ((select auth.uid()) = user_id);

-- 10. DAILY CHECKINS
DROP POLICY IF EXISTS "Users can manage their checkins" ON daily_checkins;
CREATE POLICY "Users can manage their checkins" 
ON daily_checkins FOR ALL TO authenticated USING ((select auth.uid()) = user_id);

-- 11. ADMIN_SETTINGS (Migration/Legacy)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
-- Drop both potential names to be safe
DROP POLICY IF EXISTS "Admins can view settings" ON admin_settings;
DROP POLICY IF EXISTS "Settings viewable by everyone" ON admin_settings;

CREATE POLICY "Settings viewable by everyone" 
ON admin_settings FOR SELECT TO authenticated USING (true);

-- 12. NEWS FEED
-- Read: Everyone
DROP POLICY IF EXISTS "News is viewable by everyone" ON news_feed;
CREATE POLICY "News is viewable by everyone" 
ON news_feed FOR SELECT TO authenticated USING (true);

-- Write: Admins Only
DROP POLICY IF EXISTS "Admins can manage news" ON news_feed;
CREATE POLICY "Admins can manage news" 
ON news_feed FOR ALL TO authenticated 
USING ((select is_admin from profiles where id = (select auth.uid())) = true);

-- 13. TASKS (Admin Write Access)
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
CREATE POLICY "Admins can manage tasks" 
ON tasks FOR ALL TO authenticated 
USING ((select is_admin from profiles where id = (select auth.uid())) = true);

-- 14. PAIRINGS (Admin Write Access for Generation)
DROP POLICY IF EXISTS "Admins can manage pairings" ON pairings;
CREATE POLICY "Admins can manage pairings" 
ON pairings FOR ALL TO authenticated 
USING ((select is_admin from profiles where id = (select auth.uid())) = true);

-- 15. APP SETTINGS (Admin Write Access)
DROP POLICY IF EXISTS "Admins can manage settings" ON app_settings;
CREATE POLICY "Admins can manage settings" 
ON app_settings FOR ALL TO authenticated 
USING ((select is_admin from profiles where id = (select auth.uid())) = true);

-- 16. BONUS TASKS (Admin Only)
ALTER TABLE bonus_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bonus tasks viewable by everyone" ON bonus_tasks;
CREATE POLICY "Bonus tasks viewable by everyone" 
ON bonus_tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage bonus tasks" ON bonus_tasks;
CREATE POLICY "Admins can manage bonus tasks" 
ON bonus_tasks FOR ALL TO authenticated 
USING ((select is_admin from profiles where id = (select auth.uid())) = true);

-- 17. PROFILES (Admin Management - e.g. Delete User)
DROP POLICY IF EXISTS "Admins can delete users" ON profiles;
CREATE POLICY "Admins can delete users" 
ON profiles FOR DELETE TO authenticated 
USING ((select is_admin from profiles where id = (select auth.uid())) = true);

