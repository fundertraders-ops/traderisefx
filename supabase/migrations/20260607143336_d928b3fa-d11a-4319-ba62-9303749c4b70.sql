
-- 1) Add customer details to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_details jsonb;

-- 2) Trading accounts table
CREATE TYPE public.trading_account_status AS ENUM ('pending', 'active', 'breached', 'passed', 'suspended');

CREATE TABLE public.trading_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text REFERENCES public.orders(id) ON DELETE SET NULL,
  plan text,
  size text,
  platform text NOT NULL DEFAULT 'MT5',
  server text,
  login text,
  password text,
  starting_balance numeric(14,2) NOT NULL DEFAULT 0,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  equity numeric(14,2) NOT NULL DEFAULT 0,
  profit numeric(14,2) NOT NULL DEFAULT 0,
  status public.trading_account_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  breached_reason text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX trading_accounts_user_idx ON public.trading_accounts(user_id);
CREATE INDEX trading_accounts_order_idx ON public.trading_accounts(order_id);

GRANT SELECT ON public.trading_accounts TO authenticated;
GRANT ALL ON public.trading_accounts TO service_role;

ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_trading_accounts"
  ON public.trading_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_manage_trading_accounts"
  ON public.trading_accounts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_trading_accounts_updated_at
  BEFORE UPDATE ON public.trading_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Allow admin to see/manage all orders
CREATE POLICY "admins_view_all_orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_update_orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Update confirm_order_and_credit_referral to accept customer details
CREATE OR REPLACE FUNCTION public.confirm_order_and_credit_referral(
  _order_id text,
  _amount numeric,
  _plan text,
  _size text,
  _network text,
  _tx_hash text,
  _customer_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  buyer_email text;
  referrer uuid;
  commission numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT email INTO buyer_email FROM auth.users WHERE id = uid;

  INSERT INTO public.orders (id, user_id, email, plan, size, amount, network, tx_hash, customer_details)
  VALUES (_order_id, uid, buyer_email, _plan, _size, _amount, _network, _tx_hash, _customer_details)
  ON CONFLICT (id) DO NOTHING;

  SELECT referred_by INTO referrer FROM public.profiles WHERE id = uid;
  IF referrer IS NULL THEN RETURN; END IF;

  commission := round(_amount * 0.10, 2);

  INSERT INTO public.commissions (referrer_id, referred_user_id, order_id, amount)
  VALUES (referrer, uid, _order_id, commission)
  ON CONFLICT (order_id) DO NOTHING;

  IF FOUND THEN
    UPDATE public.profiles
      SET wallet_balance = wallet_balance + commission,
          total_earned = total_earned + commission
      WHERE id = referrer;
  END IF;
END; $$;
