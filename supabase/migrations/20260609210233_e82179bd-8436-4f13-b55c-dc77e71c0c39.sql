
-- 1) Profiles: remove blanket UPDATE; add safe RPC for full_name only
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.update_own_profile_name(_full_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _full_name IS NULL OR length(trim(_full_name)) = 0 OR length(_full_name) > 120 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;
  UPDATE public.profiles SET full_name = trim(_full_name) WHERE id = uid;
END;
$$;
REVOKE ALL ON FUNCTION public.update_own_profile_name(text) FROM public;
GRANT EXECUTE ON FUNCTION public.update_own_profile_name(text) TO authenticated;

-- 2) Withdrawals: remove direct INSERT, force RPC use
DROP POLICY IF EXISTS "users_insert_own_withdrawal" ON public.withdrawals;

-- 3) Reviews: remove public anon SELECT; server function uses service role
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
