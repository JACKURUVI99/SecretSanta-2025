SELECT 
    id,
    name,
    roll_number,
    is_admin,
    created_at
FROM public.profiles
ORDER BY is_admin DESC, created_at ASC;
UPDATE public.profiles
SET is_admin = true
WHERE name = 'Your Name Here';  -- ⚠️ CHANGE THIS TO YOUR NAME!
-- OPTION B: By roll number (replace with your roll number)
-- UPDATE public.profiles
-- SET is_admin = true
-- WHERE roll_number = 'YOUR-ROLL-NUMBER';
-- OPTION C: Make the FIRST user admin
-- UPDATE public.profiles
-- SET is_admin = true
-- WHERE id = (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1);
-- ================================================================
-- STEP 3: VERIFY ADMIN STATUS
-- ================================================================
SELECT 
    name,
    roll_number,
    is_admin,
    CASE 
        WHEN is_admin = true THEN '✅ IS ADMIN'
        ELSE '❌ NOT ADMIN'
    END as status
FROM public.profiles
WHERE name = 'Your Name Here';  -- ⚠️ CHANGE THIS TO YOUR NAME!
-- ================================================================
-- STEP 4: TEST is_admin() FUNCTION
-- ================================================================
-- This should return TRUE for your user
SELECT public.is_admin(id) as admin_check, name
FROM public.profiles
WHERE name = 'Your Name Here';  
