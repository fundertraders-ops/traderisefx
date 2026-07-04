
-- 1. competitions
CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL UNIQUE,
  name text NOT NULL,
  account_size numeric NOT NULL DEFAULT 20000,
  daily_drawdown_pct numeric NOT NULL DEFAULT 10,
  max_drawdown_pct numeric NOT NULL DEFAULT 20,
  prize_1 numeric NOT NULL DEFAULT 5000,
  prize_2 numeric NOT NULL DEFAULT 2000,
  prize_3 numeric NOT NULL DEFAULT 1000,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('upcoming','active','paused','ended')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  winners_announced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.competitions TO anon, authenticated;
GRANT ALL ON public.competitions TO service_role;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitions_public_read" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "competitions_admin_all" ON public.competitions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_competitions_updated BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. competition_accounts
CREATE TABLE public.competition_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text,
  account_login text NOT NULL,
  account_password text NOT NULL,
  server text NOT NULL DEFAULT 'TradeRiseFX-Demo',
  platform text NOT NULL DEFAULT 'mt5' CHECK (platform IN ('mt4','mt5')),
  starting_balance numeric NOT NULL DEFAULT 20000,
  current_balance numeric NOT NULL DEFAULT 20000,
  current_equity numeric NOT NULL DEFAULT 20000,
  peak_equity numeric NOT NULL DEFAULT 20000,
  profit_pct numeric NOT NULL DEFAULT 0,
  profit_usd numeric NOT NULL DEFAULT 0,
  trades_count int NOT NULL DEFAULT 0,
  win_rate numeric NOT NULL DEFAULT 0,
  daily_loss_pct numeric NOT NULL DEFAULT 0,
  max_drawdown_pct numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','breached','disqualified')),
  disqualified_reason text,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(competition_id, user_id),
  UNIQUE(competition_id, account_login)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_accounts TO authenticated;
GRANT ALL ON public.competition_accounts TO service_role;
ALTER TABLE public.competition_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comp_accts_own_read" ON public.competition_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "comp_accts_admin_all" ON public.competition_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_comp_accts_comp ON public.competition_accounts(competition_id);
CREATE INDEX idx_comp_accts_user ON public.competition_accounts(user_id);

-- 3. competition_prizes
CREATE TABLE public.competition_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.competition_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rank int NOT NULL CHECK (rank IN (1,2,3)),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(competition_id, rank)
);
GRANT SELECT ON public.competition_prizes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.competition_prizes TO authenticated;
GRANT ALL ON public.competition_prizes TO service_role;
ALTER TABLE public.competition_prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comp_prizes_public_read" ON public.competition_prizes FOR SELECT USING (true);
CREATE POLICY "comp_prizes_admin_all" ON public.competition_prizes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed the current month's competition
INSERT INTO public.competitions (month, name, starts_at, ends_at, status)
VALUES (
  date_trunc('month', now())::date,
  'Monthly Trading Competition — ' || to_char(now(), 'Month YYYY'),
  date_trunc('month', now()),
  (date_trunc('month', now()) + interval '1 month' - interval '1 second'),
  'active'
)
ON CONFLICT (month) DO NOTHING;
