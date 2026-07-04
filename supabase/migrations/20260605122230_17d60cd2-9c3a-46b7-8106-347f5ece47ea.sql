
-- Profiles: restrict self-insert (trigger uses SECURITY DEFINER and bypasses)
CREATE POLICY users_insert_own_profile ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Withdrawals: restrict self-insert (RPC uses SECURITY DEFINER and bypasses)
CREATE POLICY users_insert_own_withdrawal ON public.withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- user_roles: explicitly block any non-admin insert/update/delete
CREATE POLICY users_cannot_insert_roles ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Lock down internal SECURITY DEFINER helpers from authenticated/anon callers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.profiles_protect_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;

-- Keep callable RPCs available to authenticated only
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirm_order_and_credit_referral(text, numeric, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order_and_credit_referral(text, numeric, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
