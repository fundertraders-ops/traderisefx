CREATE OR REPLACE FUNCTION public.payout_cycle_days(_plan text)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _plan IS NULL THEN 14
    WHEN lower(_plan) ~ '(^|[^a-z0-9])(1|one)[ \-]?step|^(1|one)[ \-]?step' THEN 21
    WHEN lower(_plan) ~ '(^|[^a-z0-9])(2|two)[ \-]?step|^(2|two)[ \-]?step' THEN 14
    WHEN lower(_plan) ~ 'instant' THEN 14
    ELSE 14
  END
$$;

CREATE OR REPLACE FUNCTION public.account_requires_min_hold(_plan text, _is_fee_based boolean DEFAULT false)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN COALESCE(_is_fee_based, false) THEN false
    WHEN _plan IS NULL THEN false
    WHEN lower(_plan) ~ 'instant' THEN true
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.trade_hold_seconds(_opened_at timestamptz, _closed_at timestamptz)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _opened_at IS NULL OR _closed_at IS NULL THEN NULL
    ELSE GREATEST(0, floor(extract(epoch from (_closed_at - _opened_at)))::int)
  END
$$;

CREATE OR REPLACE FUNCTION public.is_trade_valid_for_compliance(
  _plan text,
  _opened_at timestamptz,
  _closed_at timestamptz,
  _is_fee_based boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _opened_at IS NULL OR _closed_at IS NULL OR _closed_at < _opened_at THEN false
    WHEN NOT public.account_requires_min_hold(_plan, _is_fee_based) THEN true
    ELSE public.trade_hold_seconds(_opened_at, _closed_at) >= 120
  END
$$;

CREATE OR REPLACE FUNCTION public.validate_account_trade(
  _account_id uuid,
  _opened_at timestamptz,
  _closed_at timestamptz,
  _is_fee_based boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  acct record;
  requires_hold boolean;
  actual_seconds int;
  valid_trade boolean;
  reason text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT id, user_id, plan INTO acct
  FROM public.trading_accounts
  WHERE id = _account_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF acct.user_id <> uid AND NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  requires_hold := public.account_requires_min_hold(acct.plan, _is_fee_based);
  actual_seconds := public.trade_hold_seconds(_opened_at, _closed_at);
  valid_trade := public.is_trade_valid_for_compliance(acct.plan, _opened_at, _closed_at, _is_fee_based);

  reason := CASE
    WHEN _opened_at IS NULL OR _closed_at IS NULL THEN 'Missing trade open or close time'
    WHEN _closed_at < _opened_at THEN 'Trade close time is before open time'
    WHEN NOT requires_hold THEN 'No 2-minute holding rule applies to this account'
    WHEN actual_seconds >= 120 THEN 'Trade meets the 2-minute minimum holding rule'
    ELSE 'Trade closed before 2 minutes and is not valid for compliance'
  END;

  RETURN jsonb_build_object(
    'valid_for_compliance', valid_trade,
    'requires_min_hold', requires_hold,
    'minimum_hold_seconds', CASE WHEN requires_hold THEN 120 ELSE 0 END,
    'actual_hold_seconds', actual_seconds,
    'reason', reason
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.payout_cycle_days(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.account_requires_min_hold(text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.trade_hold_seconds(timestamptz, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_trade_valid_for_compliance(text, timestamptz, timestamptz, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_account_trade(uuid, timestamptz, timestamptz, boolean) TO authenticated, service_role;