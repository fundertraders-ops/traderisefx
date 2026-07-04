ALTER TABLE public.competition_accounts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_accounts;
ALTER TABLE public.competitions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;