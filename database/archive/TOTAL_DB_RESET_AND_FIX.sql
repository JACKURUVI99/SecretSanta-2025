BEGIN;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS public.news_feed (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS public.pairings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hostel TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_food TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_movie TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_emoji TEXT DEFAULT '🎅';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hobbies TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS gifting_day TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_leaderboard BOOLEAN DEFAULT true;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_gifting_day BOOLEAN DEFAULT true;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.news_feed ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.news_feed ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.news_feed ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.news_feed ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.news_feed ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);
ALTER TABLE public.pairings ADD COLUMN IF NOT EXISTS santa_id UUID REFERENCES auth.users(id);
ALTER TABLE public.pairings ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES auth.users(id);
ALTER TABLE public.pairings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_bonus BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Public read settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admin update settings" ON public.app_settings;
DROP POLICY IF EXISTS "settings_read_all" ON public.app_settings;
DROP POLICY IF EXISTS "settings_admin_update" ON public.app_settings;
DROP POLICY IF EXISTS "Public read news" ON public.news_feed;
DROP POLICY IF EXISTS "Admin manage news" ON public.news_feed;
DROP POLICY IF EXISTS "news_read_all" ON public.news_feed;
DROP POLICY IF EXISTS "news_admin_all" ON public.news_feed;
DROP POLICY IF EXISTS "Users read own pairing" ON public.pairings;
DROP POLICY IF EXISTS "pairing_view_target" ON public.pairings;
DROP POLICY IF EXISTS "pairing_admin_all" ON public.pairings;
DROP POLICY IF EXISTS "Public read tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_read_all" ON public.tasks;
DROP POLICY IF EXISTS "tasks_admin_all" ON public.tasks;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read_all" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_update" ON public.app_settings FOR ALL USING (public.check_is_admin());
ALTER TABLE public.news_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_read_all" ON public.news_feed FOR SELECT USING (true);
CREATE POLICY "news_admin_all" ON public.news_feed FOR ALL USING (public.check_is_admin());
ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pairing_view_target" ON public.pairings FOR SELECT USING (auth.uid() = santa_id);
CREATE POLICY "pairing_admin_all" ON public.pairings FOR ALL USING (public.check_is_admin());
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_read_all" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "tasks_admin_all" ON public.tasks FOR ALL USING (public.check_is_admin());
INSERT INTO public.app_settings (is_live, show_leaderboard)
SELECT false, true
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pairings;
COMMIT;
