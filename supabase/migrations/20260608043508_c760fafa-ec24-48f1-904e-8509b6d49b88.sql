
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirm_order_and_credit_referral(text, numeric, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirm_order_and_credit_referral(text, numeric, text, text, text, text, jsonb) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_order_and_credit_referral(text, numeric, text, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_order_and_credit_referral(text, numeric, text, text, text, text, jsonb) TO authenticated, service_role;
