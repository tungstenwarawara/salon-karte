-- 施術写真用のprivateバケットを作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('treatment-photos', 'treatment-photos', false);

-- Storage RLS: サロンオーナーのみアクセス可能
CREATE POLICY "Salon owners can upload treatment photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'treatment-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Salon owners can view their treatment photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'treatment-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Salon owners can delete their treatment photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'treatment-photos'
    AND auth.role() = 'authenticated'
  );
