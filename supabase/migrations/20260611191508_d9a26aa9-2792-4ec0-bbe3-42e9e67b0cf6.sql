
CREATE OR REPLACE FUNCTION public.update_own_referral_code(_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  normalized text;
  taken uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _code IS NULL THEN RAISE EXCEPTION 'Code is required'; END IF;

  normalized := upper(trim(_code));

  IF length(normalized) < 3 OR length(normalized) > 32 THEN
    RAISE EXCEPTION 'Code must be 3 to 32 characters';
  END IF;
  IF normalized !~ '^[A-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Code may only contain letters, numbers, underscore and hyphen';
  END IF;

  SELECT id INTO taken FROM public.profiles
    WHERE upper(referral_code) = normalized AND id <> uid
    LIMIT 1;
  IF taken IS NOT NULL THEN
    RAISE EXCEPTION 'That code is already taken';
  END IF;

  UPDATE public.profiles SET referral_code = normalized WHERE id = uid;
  RETURN normalized;
END;
$$;

REVOKE ALL ON FUNCTION public.update_own_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_referral_code(text) TO authenticated;
