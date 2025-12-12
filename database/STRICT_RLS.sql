-- STRICT RLS POLICIES (Backend Access Only)
-- This script revokes access for direct frontend connections (anon/authenticated)
-- and allows ONLY the Service Role (used by your Node.js Backend) to access data.

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
ALTER TABLE bonus_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. DROP ALL EXISTING POLICIES (Clean Slate)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON tasks;
DROP POLICY IF EXISTS "Users can manage their own task progress" ON user_tasks;
DROP POLICY IF EXISTS "Users can see their own pairings" ON pairings;
DROP POLICY IF EXISTS "Settings viewable by everyone" ON app_settings;
DROP POLICY IF EXISTS "Word bank viewable by everyone" ON word_bank;
DROP POLICY IF EXISTS "Users can manage their word progress" ON user_word_progress;
DROP POLICY IF EXISTS "Users can play their games" ON tictactoe_games;
DROP POLICY IF EXISTS "Users can submit their memory scores" ON memory_game_scores;
DROP POLICY IF EXISTS "Users can manage their checkins" ON daily_checkins;
DROP POLICY IF EXISTS "News is viewable by everyone" ON news_feed;
DROP POLICY IF EXISTS "Admins can manage news" ON news_feed;
DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can manage pairings" ON pairings;
DROP POLICY IF EXISTS "Admins can manage settings" ON app_settings;
DROP POLICY IF EXISTS "Bonus tasks viewable by everyone" ON bonus_tasks;
DROP POLICY IF EXISTS "Admins can manage bonus tasks" ON bonus_tasks;
DROP POLICY IF EXISTS "Admins can delete users" ON profiles;

-- 2. CREATE SERVICE_ROLE ONLY POLICIES
-- This ensures that standard users (anon/authenticated) get 0 access directly.
-- Only the "service_role" key (used in server.mjs) can bypass these (or match them).

CREATE POLICY "Backend Access Only" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON user_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON pairings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON app_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON word_bank FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON user_word_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON tictactoe_games FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON memory_game_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON daily_checkins FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON news_feed FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON bonus_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON activity_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Backend Access Only" ON admin_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
