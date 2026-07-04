ALTER FUNCTION public.validate_account_trade(uuid, timestamptz, timestamptz, boolean) SECURITY INVOKER;

REVOKE ALL ON FUNCTION public.payout_cycle_days(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.account_requires_min_hold(text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.trade_hold_seconds(timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_trade_valid_for_compliance(text, timestamptz, timestamptz, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.validate_account_trade(uuid, timestamptz, timestamptz, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.payout_cycle_days(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.account_requires_min_hold(text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.trade_hold_seconds(timestamptz, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_trade_valid_for_compliance(text, timestamptz, timestamptz, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_account_trade(uuid, timestamptz, timestamptz, boolean) TO authenticated, service_role;