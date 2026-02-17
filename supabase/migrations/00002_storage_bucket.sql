-- 施術写真用のprivateバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('treatment-photos', 'treatment-photos', false);

-- Storage RLS: サロンオーナーは自分のサロンの写真のみアクセス可能
-- storage_path format: {salon_id}/{record_id}/{type}_{timestamp}.{ext}
-- (storage.foldername(name))[1] extracts the first folder segment = salon_id
CREATE POLICY "Salon owners can upload treatment photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'treatment-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.salons WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Salon owners can view their treatment photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'treatment-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.salons WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Salon owners can delete their treatment photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'treatment-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.salons WHERE owner_id = auth.uid()
    )
  );
