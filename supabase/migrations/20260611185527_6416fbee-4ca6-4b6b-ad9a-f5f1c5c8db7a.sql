CREATE OR REPLACE FUNCTION public.account_requires_min_hold(_plan text, _is_fee_based boolean DEFAULT false)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _plan IS NULL THEN false
    WHEN lower(_plan) ~ 'instant' THEN true
    WHEN COALESCE(_is_fee_based, false) THEN false
    ELSE false
  END
$$;

REVOKE ALL ON FUNCTION public.account_requires_min_hold(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.account_requires_min_hold(text, boolean) TO authenticated, service_role;