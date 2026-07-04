
CREATE TABLE public.trade_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  caption text,
  image_path text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_results TO authenticated;
GRANT ALL ON public.trade_results TO service_role;

ALTER TABLE public.trade_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_trade_results"
  ON public.trade_results FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users_view_visible_trade_results"
  ON public.trade_results FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE TRIGGER update_trade_results_updated_at
  BEFORE UPDATE ON public.trade_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX trade_results_user_id_idx ON public.trade_results(user_id);
CREATE INDEX trade_results_created_at_idx ON public.trade_results(created_at DESC);

-- Storage policies for the trade-results bucket
CREATE POLICY "admins_manage_trade_result_files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'trade-results' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'trade-results' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users_view_visible_trade_result_files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'trade-results'
    AND EXISTS (
      SELECT 1 FROM public.trade_results tr
      WHERE tr.image_path = storage.objects.name
        AND (tr.user_id IS NULL OR tr.user_id = auth.uid())
    )
  );
