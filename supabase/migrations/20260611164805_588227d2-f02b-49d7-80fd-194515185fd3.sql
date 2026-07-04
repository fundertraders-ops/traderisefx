
CREATE TABLE public.account_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id uuid NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  image_path text NOT NULL,
  caption text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX account_gallery_account_idx ON public.account_gallery(trading_account_id);
CREATE INDEX account_gallery_user_idx ON public.account_gallery(user_id);

GRANT SELECT ON public.account_gallery TO authenticated;
GRANT ALL ON public.account_gallery TO service_role;

ALTER TABLE public.account_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own gallery"
  ON public.account_gallery FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER account_gallery_updated_at
  BEFORE UPDATE ON public.account_gallery
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for the "account-gallery" bucket
CREATE POLICY "Admins manage account-gallery objects"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'account-gallery' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'account-gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own account-gallery objects"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'account-gallery'
    AND EXISTS (
      SELECT 1 FROM public.account_gallery g
      WHERE g.image_path = storage.objects.name AND g.user_id = auth.uid()
    )
  );
