-- =================================================================
-- SUPER MIGRATION: Schema + Triggers + Fixes
-- Run this ONCE to fix:
-- 1. Missing Tables (404/400 Errors)
-- 2. Sign Up Permission Errors (RLS)
-- 3. Email Confirmation Loops
-- =================================================================

-- 1. Create Tables (Using standard types)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  roll_number TEXT,
  bio TEXT,
  favorite_emoji TEXT DEFAULT '🎅',
  points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id SERIAL PRIMARY KEY,
  gifting_day TIMESTAMP WITH TIME ZONE,
  registration_open BOOLEAN DEFAULT TRUE,
  pairing_released BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 10,
  task_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  evidence_url TEXT,
  UNIQUE(user_id, task_id)
);

CREATE TABLE IF NOT EXISTS public.pairings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  secret_santa_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id),
  UNIQUE(secret_santa_id)
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;

-- 3. Create/Update Policies (Drop first to avoid errors)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Tasks viewable by everyone" ON public.tasks;
CREATE POLICY "Tasks viewable by everyone" ON public.tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "User tasks viewable by owner" ON public.user_tasks;
CREATE POLICY "User tasks viewable by owner" ON public.user_tasks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.app_settings;
CREATE POLICY "Settings viewable by everyone" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Pairings viewable by owner" ON public.pairings;
CREATE POLICY "Pairings viewable by owner" ON public.pairings FOR SELECT USING (auth.uid() = user_id);

-- 4. Fix Signup Trigger (Bulletproof)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Insert Profile
  INSERT INTO public.profiles (id, name, roll_number, points, favorite_emoji)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'Elf'), COALESCE(new.raw_user_meta_data->>'roll_number', split_part(new.email, '@', 1)), 0, '🎅')
  ON CONFLICT (id) DO NOTHING;
  
  -- Auto-Confirm Email
  UPDATE auth.users SET email_confirmed_at = now() WHERE id = new.id;
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Seed Data (Settings & Test Tasks)
INSERT INTO public.app_settings (id, gifting_day, registration_open) 
VALUES (1, '2025-12-25 00:00:00+00', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (title, description, points)
VALUES ('Update your Bio', 'Tell your Santa what you like!', 50)
ON CONFLICT DO NOTHING;

-- 6. Fix Existing Users (Auto-Confirm & Ensure Profile)
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
