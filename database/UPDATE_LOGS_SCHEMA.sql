-- Add user tracking columns to activity_logs
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
