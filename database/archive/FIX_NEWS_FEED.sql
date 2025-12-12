DROP POLICY IF EXISTS "Public read news" ON public.news_feed;
DROP POLICY IF EXISTS "news_read_all" ON public.news_feed;
DROP POLICY IF EXISTS "news_select_all" ON public.news_feed;
DROP POLICY IF EXISTS "news_read_final" ON public.news_feed;
DROP POLICY IF EXISTS "news_admin_final" ON public.news_feed;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.news_feed;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.news_feed;
ALTER TABLE public.news_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_read_open"
ON public.news_feed
FOR SELECT
USING (true); 
CREATE POLICY "news_write_admin"
ON public.news_feed
FOR ALL
USING (
  public.is_admin(auth.uid())
);
SELECT count(*) as total_news_items FROM public.news_feed;
