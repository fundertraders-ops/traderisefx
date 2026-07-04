CREATE OR REPLACE FUNCTION public.confirm_order_and_credit_referral(
  _order_id text, _amount numeric, _plan text, _size text, _network text,
  _tx_hash text, _payment_proof_url text DEFAULT NULL::text,
  _customer_details jsonb DEFAULT NULL::jsonb,
  _addon_free_next boolean DEFAULT false,
  _is_free_redemption boolean DEFAULT false,
  _referral_code text DEFAULT NULL::text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  buyer_email text;
  credits int;
  ref_code_clean text;
  ref_user uuid;
  rate numeric;
  commission numeric;
  effective_referrer uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF _is_free_redemption THEN
    SELECT free_account_credits INTO credits FROM public.profiles WHERE id = uid FOR UPDATE;
    IF COALESCE(credits, 0) < 1 THEN
      RAISE EXCEPTION 'You have no free account credits available to redeem.';
    END IF;
    UPDATE public.profiles SET free_account_credits = free_account_credits - 1 WHERE id = uid;
  END IF;

  ref_code_clean := NULLIF(upper(trim(_referral_code)), '');
  IF ref_code_clean IS NOT NULL THEN
    SELECT id INTO ref_user FROM public.profiles WHERE referral_code = ref_code_clean LIMIT 1;
    IF ref_user IS NULL THEN RAISE EXCEPTION 'Invalid referral code'; END IF;
    IF ref_user = uid THEN RAISE EXCEPTION 'You cannot use your own referral code'; END IF;
  END IF;

  SELECT email INTO buyer_email FROM auth.users WHERE id = uid;

  -- Auto-approve: insert as approved/confirmed immediately
  INSERT INTO public.orders (
    id, user_id, email, plan, size, amount, network, tx_hash,
    customer_details, payment_proof_url, verification_status, status,
    addon_free_next, is_free_redemption,
    referral_code_used, referrer_id, verified_at
  )
  VALUES (
    _order_id, uid, buyer_email, _plan, _size, _amount, _network,
    NULLIF(trim(_tx_hash), ''), _customer_details,
    NULLIF(trim(_payment_proof_url), ''),
    'approved', 'confirmed',
    COALESCE(_addon_free_next, false),
    COALESCE(_is_free_redemption, false),
    ref_code_clean, ref_user, now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Grant add-on free credit if applicable
  IF COALESCE(_addon_free_next, false) THEN
    UPDATE public.profiles
      SET free_account_credits = free_account_credits + 1
      WHERE id = uid;
  END IF;

  -- Credit referral commission immediately (skip for free redemptions)
  IF NOT COALESCE(_is_free_redemption, false) THEN
    effective_referrer := ref_user;
    IF effective_referrer IS NULL THEN
      SELECT referred_by INTO effective_referrer FROM public.profiles WHERE id = uid;
    END IF;
    IF effective_referrer IS NOT NULL AND effective_referrer <> uid THEN
      SELECT commission_rate INTO rate FROM public.referral_settings WHERE id = 1;
      rate := COALESCE(rate, 10.00);
      commission := round(_amount * (rate / 100.0), 2);

      INSERT INTO public.commissions (referrer_id, referred_user_id, order_id, amount, status)
      VALUES (effective_referrer, uid, _order_id, commission, 'credited')
      ON CONFLICT (order_id) DO NOTHING;

      IF FOUND THEN
        UPDATE public.profiles
          SET wallet_balance = wallet_balance + commission,
              total_earned = total_earned + commission
          WHERE id = effective_referrer;
      END IF;
    END IF;
  END IF;
END;
$function$;