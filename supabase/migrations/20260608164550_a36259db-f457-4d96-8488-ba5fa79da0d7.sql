
-- Revoke broad execute from anon/public on all SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_withdrawal(numeric, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_order(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_order(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_order_and_credit_referral(text, numeric, text, text, text, text, text, jsonb, boolean, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon;

-- Grant execute back to authenticated users only (service_role keeps full access)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_order(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_order(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order_and_credit_referral(text, numeric, text, text, text, text, text, jsonb, boolean, boolean) TO authenticated;

-- Trigger-only helpers: no caller should ever invoke them directly
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_protect_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
