
-- Track when a payout was last issued for a trading account
ALTER TABLE public.trading_accounts
  ADD COLUMN IF NOT EXISTS last_payout_at timestamptz;

-- Per-trader payout requests
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id uuid NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL,
  payout_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payout requests"
  ON public.payout_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payout requests"
  ON public.payout_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payout_requests_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Determine payout cycle days from plan label
CREATE OR REPLACE FUNCTION public.payout_cycle_days(_plan text)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _plan IS NULL THEN 14
    WHEN lower(_plan) ~ '(^|[^0-9])1[ \-]?step|one[ \-]?step' THEN 21
    WHEN lower(_plan) ~ '(^|[^0-9])2[ \-]?step|two[ \-]?step' THEN 14
    WHEN lower(_plan) ~ 'instant' THEN 14
    ELSE 14
  END
$$;

-- Request a payout: validates eligibility based on plan cycle and last payout/activation date
CREATE OR REPLACE FUNCTION public.request_account_payout(
  _account_id uuid,
  _amount numeric,
  _method text,
  _payout_details jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  acct public.trading_accounts%ROWTYPE;
  cycle int;
  eligible_from timestamptz;
  pid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT * INTO acct FROM public.trading_accounts WHERE id = _account_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF acct.user_id <> uid THEN RAISE EXCEPTION 'Not your account'; END IF;
  IF acct.status = 'breached' THEN RAISE EXCEPTION 'Account is breached'; END IF;

  cycle := public.payout_cycle_days(acct.plan);
  eligible_from := COALESCE(acct.last_payout_at, acct.delivered_at, acct.created_at)
                 + make_interval(days => cycle);

  IF now() < eligible_from THEN
    RAISE EXCEPTION 'Payout not yet available. Eligible on %', to_char(eligible_from, 'YYYY-MM-DD');
  END IF;

  INSERT INTO public.payout_requests (
    trading_account_id, user_id, amount, method, payout_details, status
  ) VALUES (
    _account_id, uid, _amount, _method, COALESCE(_payout_details, '{}'::jsonb), 'pending'
  ) RETURNING id INTO pid;

  UPDATE public.trading_accounts SET last_payout_at = now() WHERE id = _account_id;

  RETURN pid;
END;
$$;
