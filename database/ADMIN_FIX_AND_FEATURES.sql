BEGIN;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_kollywood BOOLEAN DEFAULT TRUE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_bonus_tasks BOOLEAN DEFAULT TRUE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_leaderboard BOOLEAN DEFAULT TRUE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_news BOOLEAN DEFAULT TRUE;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS show_secret_santa BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update anyone" ON public.profiles;
CREATE POLICY "Admins can update anyone" ON public.profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage settings" ON public.app_settings;
CREATE POLICY "Admins manage settings" ON public.app_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
DROP POLICY IF EXISTS "Everyone view settings" ON public.app_settings;
CREATE POLICY "Everyone view settings" ON public.app_settings FOR SELECT USING (TRUE);
ALTER TABLE public.news_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage news" ON public.news_feed;
CREATE POLICY "Admins manage news" ON public.news_feed FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.bonus_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage bonus tasks" ON public.bonus_tasks;
CREATE POLICY "Admins manage bonus tasks" ON public.bonus_tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
INSERT INTO public.app_settings (id, gifting_day, registration_open)
VALUES (1, '2025-12-25', TRUE)
ON CONFLICT (id) DO NOTHING;
NOTIFY pgrst, 'reload schema';
COMMIT;
