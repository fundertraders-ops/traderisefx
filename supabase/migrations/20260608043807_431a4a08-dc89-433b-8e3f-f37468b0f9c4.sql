
-- 1. Add verification columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_verification_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_verification_status_check
  CHECK (verification_status IN ('pending','approved','rejected'));

-- 2. Drop old confirm functions; replace with proof-aware version
DROP FUNCTION IF EXISTS public.confirm_order_and_credit_referral(text, numeric, text, text, text, text);
DROP FUNCTION IF EXISTS public.confirm_order_and_credit_referral(text, numeric, text, text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.confirm_order_and_credit_referral(
  _order_id text,
  _amount numeric,
  _plan text,
  _size text,
  _network text,
  _tx_hash text,
  _payment_proof_url text DEFAULT NULL,
  _customer_details jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  buyer_email text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF (_tx_hash IS NULL OR length(trim(_tx_hash)) = 0)
     AND (_payment_proof_url IS NULL OR length(trim(_payment_proof_url)) = 0) THEN
    RAISE EXCEPTION 'Please provide either a Transaction ID (TXID) or a Payment Screenshot to verify your payment.';
  END IF;

  SELECT email INTO buyer_email FROM auth.users WHERE id = uid;

  INSERT INTO public.orders (
    id, user_id, email, plan, size, amount, network, tx_hash,
    customer_details, payment_proof_url, verification_status, status
  )
  VALUES (
    _order_id, uid, buyer_email, _plan, _size, _amount, _network,
    NULLIF(trim(_tx_hash), ''),
    _customer_details,
    NULLIF(trim(_payment_proof_url), ''),
    'pending',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_order_and_credit_referral(text, numeric, text, text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_order_and_credit_referral(text, numeric, text, text, text, text, text, jsonb) TO authenticated, service_role;

-- 3. Admin approve / reject helpers (credit referral commission on approve)
CREATE OR REPLACE FUNCTION public.approve_order(_order_id text, _notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  o public.orders%ROWTYPE;
  referrer uuid;
  commission numeric;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF o.verification_status = 'approved' THEN RETURN; END IF;

  UPDATE public.orders
    SET verification_status = 'approved',
        status = 'confirmed',
        verification_notes = COALESCE(_notes, verification_notes),
        verified_at = now(),
        verified_by = uid
    WHERE id = _order_id;

  -- credit referral if applicable
  SELECT referred_by INTO referrer FROM public.profiles WHERE id = o.user_id;
  IF referrer IS NULL THEN RETURN; END IF;

  commission := round(o.amount * 0.10, 2);

  INSERT INTO public.commissions (referrer_id, referred_user_id, order_id, amount)
  VALUES (referrer, o.user_id, o.id, commission)
  ON CONFLICT (order_id) DO NOTHING;

  IF FOUND THEN
    UPDATE public.profiles
      SET wallet_balance = wallet_balance + commission,
          total_earned = total_earned + commission
      WHERE id = referrer;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_order(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_order(text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reject_order(_order_id text, _notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.orders
    SET verification_status = 'rejected',
        status = 'rejected',
        verification_notes = COALESCE(_notes, verification_notes),
        verified_at = now(),
        verified_by = uid
    WHERE id = _order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_order(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_order(text, text) TO authenticated, service_role;
