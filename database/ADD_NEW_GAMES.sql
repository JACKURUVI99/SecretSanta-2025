-- 1. Add Toggle Settings to app_settings
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS show_crossword BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_bad_description BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_bingo BOOLEAN DEFAULT FALSE;

-- Helper Function: is_admin()
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Progress Tables

-- Bingo Cards (One per user)
CREATE TABLE IF NOT EXISTS bingo_cards (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    card_grid JSONB NOT NULL, -- 5x5 Grid of words
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bingo State (Singleton for Game Master)
CREATE TABLE IF NOT EXISTS bingo_state (
    id SERIAL PRIMARY KEY,
    called_words JSONB DEFAULT '[]'::JSONB, -- List of words called so far
    last_called_at TIMESTAMPTZ DEFAULT NOW()
);
-- Ensure only one row exists
INSERT INTO bingo_state (id, called_words) VALUES (1, '[]'::JSONB) ON CONFLICT (id) DO NOTHING;

-- Jumbled Words Progress
CREATE TABLE IF NOT EXISTS jumbled_words_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    completed_words JSONB DEFAULT '[]'::JSONB, -- List of completed word IDs
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Crossword Progress
CREATE TABLE IF NOT EXISTS crossword_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    completed_words JSONB DEFAULT '[]'::JSONB, -- List of completed clue IDs
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Bad Description Progress
CREATE TABLE IF NOT EXISTS bad_description_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    completed_ids JSONB DEFAULT '[]'::JSONB, -- List of completed question IDs
    total_stars INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Enable RLS
ALTER TABLE jumbled_words_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossword_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bad_description_progress ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Allow users to read/update their own)
DROP POLICY IF EXISTS "Users can view own jumbled progress" ON jumbled_words_progress;
CREATE POLICY "Users can view own jumbled progress" ON jumbled_words_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own jumbled progress" ON jumbled_words_progress;
CREATE POLICY "Users can update own jumbled progress" ON jumbled_words_progress FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own jumbled progress" ON jumbled_words_progress;
CREATE POLICY "Users can insert own jumbled progress" ON jumbled_words_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own crossword progress" ON crossword_progress;
CREATE POLICY "Users can view own crossword progress" ON crossword_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own crossword progress" ON crossword_progress;
CREATE POLICY "Users can update own crossword progress" ON crossword_progress FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own crossword progress" ON crossword_progress;
CREATE POLICY "Users can insert own crossword progress" ON crossword_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Phase 4: Rules & Participation Logic
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS game_rules_active BOOLEAN DEFAULT FALSE;

-- Ensure RLS allows users to update their own terms_accepted status
CREATE POLICY "Users can update their own terms_accepted" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own bad desc progress" ON bad_description_progress;
CREATE POLICY "Users can view own bad desc progress" ON bad_description_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own bad desc progress" ON bad_description_progress;
CREATE POLICY "Users can update own bad desc progress" ON bad_description_progress FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own bad desc progress" ON bad_description_progress;
CREATE POLICY "Users can insert own bad desc progress" ON bad_description_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bingo Policies
ALTER TABLE bingo_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bingo card" ON bingo_cards;
CREATE POLICY "Users can view own bingo card" ON bingo_cards FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own bingo card" ON bingo_cards;
CREATE POLICY "Users can insert own bingo card" ON bingo_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can read bingo state" ON bingo_state;
CREATE POLICY "Users can read bingo state" ON bingo_state FOR SELECT USING (true); -- Everyone can read state

-- Admin Policies
DROP POLICY IF EXISTS "Admins can view all jumbled progress" ON jumbled_words_progress;
CREATE POLICY "Admins can view all jumbled progress" ON jumbled_words_progress FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can view all crossword progress" ON crossword_progress;
CREATE POLICY "Admins can view all crossword progress" ON crossword_progress FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can view all bad desc progress" ON bad_description_progress;
CREATE POLICY "Admins can view all bad desc progress" ON bad_description_progress FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can manage bingo cards" ON bingo_cards;
CREATE POLICY "Admins can manage bingo cards" ON bingo_cards FOR ALL USING (is_admin());
DROP POLICY IF EXISTS "Admins can manage bingo state" ON bingo_state;
CREATE POLICY "Admins can manage bingo state" ON bingo_state FOR ALL USING (is_admin());


-- 5. Reset Functions (RPC)

CREATE OR REPLACE FUNCTION reset_jumbled_words()
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  DELETE FROM jumbled_words_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_crossword()
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  DELETE FROM crossword_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_bad_description()
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  DELETE FROM bad_description_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_bingo()
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  DELETE FROM bingo_cards;
  UPDATE bingo_state SET called_words = '[]'::JSONB WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON TABLE jumbled_words_progress TO authenticated;
GRANT ALL ON TABLE crossword_progress TO authenticated;
GRANT ALL ON TABLE bad_description_progress TO authenticated;
GRANT ALL ON TABLE bingo_cards TO authenticated;
GRANT ALL ON TABLE bingo_state TO authenticated;
GRANT ALL ON TABLE jumbled_words_progress TO service_role;
GRANT ALL ON TABLE crossword_progress TO service_role;
GRANT ALL ON TABLE bad_description_progress TO service_role;
GRANT ALL ON TABLE bingo_cards TO service_role;
GRANT ALL ON TABLE bingo_state TO service_role;

GRANT EXECUTE ON FUNCTION reset_jumbled_words TO authenticated;
GRANT EXECUTE ON FUNCTION reset_crossword TO authenticated;
GRANT EXECUTE ON FUNCTION reset_bad_description TO authenticated;
GRANT EXECUTE ON FUNCTION reset_bingo TO authenticated;

-- Force refreshing schema cache by selecting from new tables (optional check)
SELECT count(*) FROM jumbled_words_progress;
SELECT count(*) FROM crossword_progress;
SELECT count(*) FROM bad_description_progress;
SELECT count(*) FROM bingo_cards;
