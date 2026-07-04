ALTER TABLE public.trade_results ADD COLUMN IF NOT EXISTS trade_date date;
UPDATE public.trade_results SET trade_date = created_at::date WHERE trade_date IS NULL;
ALTER TABLE public.trade_results ALTER COLUMN trade_date SET NOT NULL;