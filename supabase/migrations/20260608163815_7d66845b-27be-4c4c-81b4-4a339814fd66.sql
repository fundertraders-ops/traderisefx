
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_account_credits integer NOT NULL DEFAULT 0;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS addon_free_next boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_free_redemption boolean NOT NULL DEFAULT false;

-- Protect free_account_credits from direct user updates
CREATE OR REPLACE FUNCTION public.profiles_protect_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance
     OR NEW.total_earned IS DISTINCT FROM OLD.total_earned
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.free_account_credits IS DISTINCT FROM OLD.free_account_credits THEN
    IF current_setting('role', true) <> 'service_role' AND current_user <> 'postgres' THEN
      RAISE EXCEPTION 'Cannot modify protected profile fields';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $function$;

-- Replace confirm function to accept addon + free redemption flags
CREATE OR REPLACE FUNCTION public.confirm_order_and_credit_referral(
  _order_id text, _amount numeric, _plan text, _size text, _network text,
  _tx_hash text, _payment_proof_url text DEFAULT NULL::text,
  _customer_details jsonb DEFAULT NULL::jsonb,
  _addon_free_next boolean DEFAULT false,
  _is_free_redemption boolean DEFAULT false
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  buyer_email text;
  credits int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF _is_free_redemption THEN
    SELECT free_account_credits INTO credits FROM public.profiles WHERE id = uid FOR UPDATE;
    IF COALESCE(credits, 0) < 1 THEN
      RAISE EXCEPTION 'You have no free account credits available to redeem.';
    END IF;
    -- Reserve the credit immediately; refunded by reject_order if rejected
    UPDATE public.profiles SET free_account_credits = free_account_credits - 1 WHERE id = uid;
  ELSE
    IF (_tx_hash IS NULL OR length(trim(_tx_hash)) = 0)
       AND (_payment_proof_url IS NULL OR length(trim(_payment_proof_url)) = 0) THEN
      RAISE EXCEPTION 'Please provide either a Transaction ID (TXID) or a Payment Screenshot to verify your payment.';
    END IF;
  END IF;

  SELECT email INTO buyer_email FROM auth.users WHERE id = uid;

  INSERT INTO public.orders (
    id, user_id, email, plan, size, amount, network, tx_hash,
    customer_details, payment_proof_url, verification_status, status,
    addon_free_next, is_free_redemption
  )
  VALUES (
    _order_id, uid, buyer_email, _plan, _size, _amount, _network,
    NULLIF(trim(_tx_hash), ''),
    _customer_details,
    NULLIF(trim(_payment_proof_url), ''),
    'pending',
    'pending',
    COALESCE(_addon_free_next, false),
    COALESCE(_is_free_redemption, false)
  )
  ON CONFLICT (id) DO NOTHING;
END;
$function$;

-- Update approve_order to grant credit when addon was purchased, and ensure reject refunds free redemption
CREATE OR REPLACE FUNCTION public.approve_order(_order_id text, _notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Grant a free-account credit if the buyer purchased the addon
  IF o.addon_free_next THEN
    UPDATE public.profiles
      SET free_account_credits = free_account_credits + 1
      WHERE id = o.user_id;
  END IF;

  -- credit referral if applicable (skip for free redemptions)
  IF o.is_free_redemption THEN RETURN; END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.reject_order(_order_id text, _notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  o public.orders%ROWTYPE;
BEGIN
  IF uid IS NULL OR NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  -- Refund the reserved credit if this was a free redemption that hadn't been approved yet
  IF o.is_free_redemption AND o.verification_status <> 'approved' THEN
    UPDATE public.profiles
      SET free_account_credits = free_account_credits + 1
      WHERE id = o.user_id;
  END IF;

  UPDATE public.orders
    SET verification_status = 'rejected',
        status = 'rejected',
        verification_notes = COALESCE(_notes, verification_notes),
        verified_at = now(),
        verified_by = uid
    WHERE id = _order_id;
END;
$function$;
