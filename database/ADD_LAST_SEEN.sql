-- Add last_seen to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Create Heartbeat Policy (if needed, but profiles is usually updated by user anyway)
-- Just ensuring users can update their own last_seen
-- Existing policy "Users can update own profile" should cover it.

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
