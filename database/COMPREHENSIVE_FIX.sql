ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON pairings TO authenticated;
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON bonus_tasks TO authenticated;
GRANT ALL ON news_feed TO authenticated;
GRANT ALL ON app_settings TO authenticated;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything on pairings" ON pairings;
DROP POLICY IF EXISTS "Admins can do everything on tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can do everything on bonus_tasks" ON bonus_tasks;
DROP POLICY IF EXISTS "Admins can do everything on news_feed" ON news_feed;
DROP POLICY IF EXISTS "Admins can do everything on app_settings" ON app_settings;
CREATE POLICY "Admins can do everything on profiles"
ON profiles FOR ALL
TO authenticated
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true )
WITH CHECK ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );
CREATE POLICY "Admins can do everything on pairings"
ON pairings FOR ALL
TO authenticated
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true )
WITH CHECK ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );
CREATE POLICY "Admins can do everything on tasks"
ON tasks FOR ALL
TO authenticated
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true )
WITH CHECK ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );
CREATE POLICY "Admins can do everything on bonus_tasks"
ON bonus_tasks FOR ALL
TO authenticated
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true )
WITH CHECK ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );
CREATE POLICY "Admins can do everything on news_feed"
ON news_feed FOR ALL
TO authenticated
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true )
WITH CHECK ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );
CREATE POLICY "Admins can do everything on app_settings"
ON app_settings FOR ALL
TO authenticated
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true )
WITH CHECK ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );
CREATE POLICY "Public read news" ON news_feed FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read bonus" ON bonus_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read settings" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP FUNCTION IF EXISTS get_public_settings();
CREATE OR REPLACE FUNCTION get_public_settings()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'maintenance_mode', maintenance_mode,
      'registration_open', registration_open,
      'show_secret_santa', show_secret_santa
    )
    FROM app_settings
    LIMIT 1
  );
END;
$$;
