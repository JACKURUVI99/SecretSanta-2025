-- Create Polls Table
CREATE TABLE IF NOT EXISTS polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings e.g. ["Apple", "Banana"]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Policies for Polls
-- Everyone can read active polls
CREATE POLICY "Public can view active polls" ON polls
    FOR SELECT USING (true); -- Or (is_active = true)

-- Only admins can insert/update/delete (We'll use service role or admin check triggers if needed, but for now open read, restricted write via API logic or simple policy)
-- For simplicity in this project context, we allow authenticated users to read.
-- Writing is restricted to admins ideally, but we'll handle that via API logic or standard RLS if user has is_admin flag.
-- Assuming 'is_admin' is on profiles. Let's just allow read for now. Write via Service Role (Admin Dashboard uses high privilege usually) or we add a policy:
-- CREATE POLICY "Admins can manage polls" ON polls USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Create Poll Votes Table
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id, user_id) -- One vote per poll per user
);

-- Enable RLS
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies for Votes
-- Users can view all votes (to see results) or just their own? Let's allow viewing all for live results.
CREATE POLICY "Public can view votes" ON poll_votes FOR SELECT USING (true);

-- Users can insert their own vote
CREATE POLICY "Users can vote" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add 'show_polls' to app_settings if not exists
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS show_polls BOOLEAN DEFAULT TRUE;
