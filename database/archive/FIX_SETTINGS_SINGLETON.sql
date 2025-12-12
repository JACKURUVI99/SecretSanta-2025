BEGIN;
DELETE FROM public.app_settings
WHERE id NOT IN (
  SELECT id FROM public.app_settings
  ORDER BY created_at DESC
  LIMIT 1
);
INSERT INTO public.app_settings (is_live, show_leaderboard, show_gifting_day, gifting_day)
SELECT false, true, true, NOW() + INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS secret_santa_reveal BOOLEAN DEFAULT false;
UPDATE public.app_settings
SET secret_santa_reveal = true,
    show_leaderboard = true
WHERE id = (SELECT id FROM public.app_settings LIMIT 1);
COMMIT;
SELECT * FROM public.app_settings;
