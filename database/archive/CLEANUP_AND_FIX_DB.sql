DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update anyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins can do everything on news_feed" ON public.news_feed;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Public read" ON public.profiles;
DROP POLICY IF EXISTS "Read own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all_v4" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_final" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_final" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_final" ON public.profiles;
DROP POLICY IF EXISTS "Everyone view settings" ON public.app_settings;
DROP POLICY IF EXISTS "Public read settings" ON public.app_settings;
DROP POLICY IF EXISTS "Settings read" ON public.app_settings;
DROP POLICY IF EXISTS "settings_read_all" ON public.app_settings;
DROP POLICY IF EXISTS "settings_select_all" ON public.app_settings;
DROP POLICY IF EXISTS "settings_read_final" ON public.app_settings;
DROP POLICY IF EXISTS "settings_admin_final" ON public.app_settings;
DROP POLICY IF EXISTS "Public read news" ON public.news_feed;
DROP POLICY IF EXISTS "news_read_all" ON public.news_feed;
DROP POLICY IF EXISTS "news_select_all" ON public.news_feed;
DROP POLICY IF EXISTS "news_read_final" ON public.news_feed;
DROP POLICY IF EXISTS "news_admin_final" ON public.news_feed;
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_final" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "profiles_update_final" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id OR public.is_admin(auth.uid())
    );
CREATE POLICY "profiles_insert_final" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR public.is_admin(auth.uid())
    );
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read_final" ON public.app_settings
    FOR SELECT USING (true);
CREATE POLICY "settings_admin_final" ON public.app_settings
    FOR ALL USING (public.is_admin(auth.uid()));
ALTER TABLE public.news_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_read_final" ON public.news_feed
    FOR SELECT USING (true);
CREATE POLICY "news_admin_final" ON public.news_feed
    FOR ALL USING (public.is_admin(auth.uid()));
