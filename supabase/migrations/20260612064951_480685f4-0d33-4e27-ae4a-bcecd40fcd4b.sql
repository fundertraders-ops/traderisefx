CREATE TABLE public.sales_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('BDM','RM','ARM')),
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sales_business_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.sales_team_members(id) ON DELETE CASCADE,
  period_month DATE NOT NULL,
  business_volume NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_entries_member ON public.sales_business_entries(member_id);
CREATE INDEX idx_sales_entries_period ON public.sales_business_entries(period_month);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_team_members TO authenticated;
GRANT ALL ON public.sales_team_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_business_entries TO authenticated;
GRANT ALL ON public.sales_business_entries TO service_role;

ALTER TABLE public.sales_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_business_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sales members" ON public.sales_team_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage sales entries" ON public.sales_business_entries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_sales_members_updated BEFORE UPDATE ON public.sales_team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sales_entries_updated BEFORE UPDATE ON public.sales_business_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();