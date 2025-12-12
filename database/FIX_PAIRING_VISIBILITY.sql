-- FIX PAIRING VISIBILITY
-- The user needs to see who they are gifting to (where secret_santa_id = me).
-- Currently, they can arguably only find who is gifting to them (user_id = me) which defeats the "Secret" purpose if not handled,
-- but definitely blocks them from seeing their target.

BEGIN;

ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pairings_select_own_target" ON public.pairings;
DROP POLICY IF EXISTS "Users view their target" ON public.pairings;

-- Policy: Users can see the row if they are the USER (recipient) OR the SECRET SANTA (giver)
-- This allows fetching both "My Santa" (for reveal) and "My Giftee" (for gifting).
CREATE POLICY "pairings_select_participant"
ON public.pairings
FOR SELECT
USING (
    auth.uid() = user_id OR 
    auth.uid() = secret_santa_id
);

-- Ensure Admins still have full access (covered by admin policies usually, but reinforcing)
DROP POLICY IF EXISTS "Admins manage pairings" ON public.pairings;
CREATE POLICY "Admins manage pairings" ON public.pairings FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

COMMIT;
