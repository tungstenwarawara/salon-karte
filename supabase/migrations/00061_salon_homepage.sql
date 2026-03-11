-- サロンHP機能: hp_enabled + hp_content を salons テーブルに追加
-- hp_content は JSONB でヒーロー、サロン紹介、こだわり、施術の流れ、
-- お客様の声、FAQ、アクセス補足、SNSリンク、ギャラリーを格納

ALTER TABLE salons
ADD COLUMN hp_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN hp_content JSONB;

COMMENT ON COLUMN salons.hp_enabled IS 'HPの公開/非公開フラグ';
COMMENT ON COLUMN salons.hp_content IS 'HP全セクションの内容（JSONB）';

-- salon-hp-photos 公開バケット（HPは認証不要ページのため public）
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-hp-photos', 'salon-hp-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: サロンオーナーのみアップロード可能
CREATE POLICY "salon_hp_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'salon-hp-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.salons WHERE owner_id = auth.uid()
    )
  );

-- 誰でも閲覧可能（公開HP用）
CREATE POLICY "salon_hp_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'salon-hp-photos');

-- サロンオーナーのみ削除可能
CREATE POLICY "salon_hp_photos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'salon-hp-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.salons WHERE owner_id = auth.uid()
    )
  );
