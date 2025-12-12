BEGIN;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
COMMIT;
