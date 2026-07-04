CREATE POLICY "Admins read generated-documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'generated-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete generated-documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'generated-documents' AND public.has_role(auth.uid(), 'admin'));
