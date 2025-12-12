BEGIN;
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pairings;
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
COMMIT;
