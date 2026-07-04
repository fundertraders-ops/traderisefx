
-- 1) Realtime: re-publish competition_accounts with only safe columns (no password/login)
ALTER PUBLICATION supabase_realtime DROP TABLE public.competition_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_accounts
  (id, competition_id, user_id, display_name, starting_balance, current_balance,
   current_equity, peak_equity, profit_pct, profit_usd, trades_count, win_rate,
   daily_loss_pct, max_drawdown_pct, status, disqualified_reason,
   last_updated_at, created_at);

-- 2) competition_prizes: remove public-read policy; reads happen via supabaseAdmin server fns
DROP POLICY IF EXISTS comp_prizes_public_read ON public.competition_prizes;

-- 3) reviews: revoke column-level read of moderation fields from regular users
REVOKE SELECT (moderation_notes, moderated_by, moderated_at) ON public.reviews FROM authenticated;
REVOKE SELECT (moderation_notes, moderated_by, moderated_at) ON public.reviews FROM anon;
-- Admins/server use service_role which retains full access
