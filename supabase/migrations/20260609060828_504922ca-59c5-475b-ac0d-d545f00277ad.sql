CREATE POLICY "anon_view_public_trade_results" ON public.trade_results FOR SELECT TO anon USING (user_id IS NULL);
GRANT SELECT ON public.trade_results TO anon;