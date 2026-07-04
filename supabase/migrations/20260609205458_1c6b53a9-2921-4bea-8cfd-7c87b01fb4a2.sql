-- 1. Referral settings (single-row)
CREATE TABLE public.referral_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT ON public.referral_settings TO authenticated;
GRANT ALL ON public.referral_settings TO service_role;
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed-in can read referral settings"
  ON public.referral_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins update referral settings"
  ON public.referral_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.referral_settings (id, commission_rate) VALUES (1, 10.00)
  ON CONFLICT (id) DO NOTHING;

-- 2. Order columns for checkout-time referrals
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS referral_code_used TEXT,
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_referrer ON public.orders (referrer_id);

-- 3. Replace confirm_order_and_credit_referral (drop both overloads, recreate with referral code)
DROP FUNCTION IF EXISTS public.confirm_order_and_credit_referral(text, numeric, text, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.confirm_order_and_credit_referral(text, numeric, text, text, text, text, text, jsonb, boolean, boolean);

CREATE OR REPLACE FUNCTION public.confirm_order_and_credit_referral(
  _order_id text,
  _amount numeric,
  _plan text,
  _size text,
  _network text,
  _tx_hash text,
  _payment_proof_url text DEFAULT NULL,
  _customer_details jsonb DEFAULT NULL,
  _addon_free_next boolean DEFAULT false,
  _is_free_redemption boolean DEFAULT false,
  _referral_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  buyer_email text;
  credits int;
  ref_code_clean text;
  ref_user uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF _is_free_redemption THEN
    SELECT free_account_credits INTO credits FROM public.profiles WHERE id = uid FOR UPDATE;
    IF COALESCE(credits, 0) < 1 THEN
      RAISE EXCEPTION 'You have no free account credits available to redeem.';
    END IF;
    UPDATE public.profiles SET free_account_credits = free_account_credits - 1 WHERE id = uid;
  ELSE
    IF (_tx_hash IS NULL OR length(trim(_tx_hash)) = 0)
       AND (_payment_proof_url IS NULL OR length(trim(_payment_proof_url)) = 0) THEN
      RAISE EXCEPTION 'Please provide either a Transaction ID (TXID) or a Payment Screenshot to verify your payment.';
    END IF;
  END IF;

  -- Resolve referral code (optional). Reject self-referral and unknown codes.
  ref_code_clean := NULLIF(upper(trim(_referral_code)), '');
  IF ref_code_clean IS NOT NULL THEN
    SELECT id INTO ref_user FROM public.profiles WHERE referral_code = ref_code_clean LIMIT 1;
    IF ref_user IS NULL THEN
      RAISE EXCEPTION 'Invalid referral code';
    END IF;
    IF ref_user = uid THEN
      RAISE EXCEPTION 'You cannot use your own referral code';
    END IF;
  END IF;

  SELECT email INTO buyer_email FROM auth.users WHERE id = uid;

  INSERT INTO public.orders (
    id, user_id, email, plan, size, amount, network, tx_hash,
    customer_details, payment_proof_url, verification_status, status,
    addon_free_next, is_free_redemption,
    referral_code_used, referrer_id
  )
  VALUES (
    _order_id, uid, buyer_email, _plan, _size, _amount, _network,
    NULLIF(trim(_tx_hash), ''),
    _customer_details,
    NULLIF(trim(_payment_proof_url), ''),
    'pending',
    'pending',
    COALESCE(_addon_free_next, false),
    COALESCE(_is_free_redemption, false),
    ref_code_clean,
    ref_user
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- 4. Replace approve_order to use configurable rate + per-order referrer
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
  rate numeric;
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

  IF o.addon_free_next THEN
    UPDATE public.profiles
      SET free_account_credits = free_account_credits + 1
      WHERE id = o.user_id;
  END IF;

  IF o.is_free_redemption THEN RETURN; END IF;

  -- Determine referrer: per-order code first, fallback to signup-time referrer
  referrer := o.referrer_id;
  IF referrer IS NULL THEN
    SELECT referred_by INTO referrer FROM public.profiles WHERE id = o.user_id;
  END IF;
  IF referrer IS NULL OR referrer = o.user_id THEN RETURN; END IF;

  SELECT commission_rate INTO rate FROM public.referral_settings WHERE id = 1;
  rate := COALESCE(rate, 10.00);
  commission := round(o.amount * (rate / 100.0), 2);

  INSERT INTO public.commissions (referrer_id, referred_user_id, order_id, amount, status)
  VALUES (referrer, o.user_id, o.id, commission, 'credited')
  ON CONFLICT (order_id) DO NOTHING;

  IF FOUND THEN
    UPDATE public.profiles
      SET wallet_balance = wallet_balance + commission,
          total_earned = total_earned + commission
      WHERE id = referrer;
  END IF;
END;
$$;

-- 5. Admin: update commission rate
CREATE OR REPLACE FUNCTION public.set_commission_rate(_rate numeric)
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
  IF _rate < 0 OR _rate > 100 THEN
    RAISE EXCEPTION 'Rate must be between 0 and 100';
  END IF;
  UPDATE public.referral_settings
    SET commission_rate = _rate, updated_at = now(), updated_by = uid
    WHERE id = 1;
END;
$$;

-- 6. Admin: approve/reject/reverse a commission, adjusting referrer wallet as needed
CREATE OR REPLACE FUNCTION public.admin_set_commission_status(_commission_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  c public.commissions%ROWTYPE;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _status NOT IN ('credited','pending','rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO c FROM public.commissions WHERE id = _commission_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Commission not found'; END IF;

  -- Going from credited -> not credited: deduct from referrer wallet
  IF c.status = 'credited' AND _status <> 'credited' THEN
    UPDATE public.profiles
      SET wallet_balance = GREATEST(0, wallet_balance - c.amount),
          total_earned = GREATEST(0, total_earned - c.amount)
      WHERE id = c.referrer_id;
  END IF;

  -- Going from not credited -> credited: add to referrer wallet
  IF c.status <> 'credited' AND _status = 'credited' THEN
    UPDATE public.profiles
      SET wallet_balance = wallet_balance + c.amount,
          total_earned = total_earned + c.amount
      WHERE id = c.referrer_id;
  END IF;

  UPDATE public.commissions SET status = _status WHERE id = _commission_id;
END;
$$;
