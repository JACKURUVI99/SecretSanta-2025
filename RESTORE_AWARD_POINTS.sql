-- RESTORES THE MISSING "award_points" FUNCTION
-- Required for Memory Game and Bonus Tasks to add points correctly.

CREATE OR REPLACE FUNCTION public.award_points(p_points INT, p_description TEXT DEFAULT 'Game Reward')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Safely add points to the user's profile
  UPDATE public.profiles
  SET points = COALESCE(points, 0) + p_points
  WHERE id = auth.uid();
  
  -- 2. Optional: Log this transaction if you have a history table (Skipped to stay safe)
END;
$$;

NOTIFY pgrst, 'reload schema';
