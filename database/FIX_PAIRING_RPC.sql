BEGIN;
CREATE OR REPLACE FUNCTION public.get_user_pairings(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_santa JSONB;
    v_giftee JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'favorite_emoji', p.favorite_emoji,
        'bio', p.bio,
        'avatar_url', p.avatar_url,
        'roll_number', p.roll_number
    ) INTO v_santa
    FROM pairings pr
    JOIN profiles p ON pr.secret_santa_id = p.id
    WHERE pr.user_id = p_user_id;
    -- Get MY Giftee (Who am I giving to?)
    -- secret_santa_id = ME, user_id = GIFTEE
    SELECT jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'favorite_emoji', p.favorite_emoji,
        'bio', p.bio,
        'avatar_url', p.avatar_url,
        'roll_number', p.roll_number
    ) INTO v_giftee
    FROM pairings pr
    JOIN profiles p ON pr.user_id = p.id
    WHERE pr.secret_santa_id = p_user_id;
    RETURN jsonb_build_object(
        'my_santa', v_santa,       -- ✅ Scalpel fix: Matches UserDashboard.tsx
        'my_giftee', v_giftee      -- ✅ Scalpel fix: Matches UserDashboard.tsx
    );
END;
$$;
-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.get_user_pairings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_pairings(UUID) TO anon;
COMMIT;
NOTIFY pgrst, 'reload schema';
