DROP FUNCTION IF EXISTS get_public_settings();
CREATE OR REPLACE FUNCTION get_public_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT to_jsonb(s) INTO result
  FROM public.app_settings s
  ORDER BY created_at DESC
  LIMIT 1;
  IF (result ? 'secret_santa_reveal') AND NOT (result ? 'show_secret_santa') THEN
    result := jsonb_set(result, '{show_secret_santa}', result->'secret_santa_reveal');
  END IF;
  RETURN result;
END;
$$;
SELECT get_public_settings();
