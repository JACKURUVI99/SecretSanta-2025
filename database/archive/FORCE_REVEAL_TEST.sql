UPDATE public.app_settings
SET secret_santa_reveal = true,
    show_secret_santa = true
WHERE id = (SELECT id FROM public.app_settings ORDER BY created_at DESC LIMIT 1);
