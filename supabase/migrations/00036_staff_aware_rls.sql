-- Phase 1: RLSポリシーにstaffパスを追加（additive approach）
-- 既存 owner_id パスを維持 + staff テーブル経由の新パスを追加
-- get_user_salon_ids() ヘルパー関数で重複ロジックを共通化

-- =============================================================================
-- ヘルパー関数: 現在のユーザーがアクセス可能な salon_id 一覧
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_salon_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id FROM salons WHERE owner_id = (select auth.uid())
  UNION
  SELECT salon_id FROM staff WHERE auth_user_id = (select auth.uid()) AND is_active = true
$$;

-- =============================================================================
-- salons: SELECT=owner+staff / INSERT,UPDATE,DELETE=ownerのみ
-- =============================================================================
DROP POLICY IF EXISTS "Users can manage their own salons" ON salons;

CREATE POLICY "salon_select" ON salons
  FOR SELECT USING (
    owner_id = (select auth.uid())
    OR id IN (SELECT salon_id FROM staff WHERE auth_user_id = (select auth.uid()) AND is_active = true)
  );

CREATE POLICY "salon_insert" ON salons
  FOR INSERT WITH CHECK (
    owner_id = (select auth.uid())
  );

CREATE POLICY "salon_update" ON salons
  FOR UPDATE USING (
    owner_id = (select auth.uid())
  );

CREATE POLICY "salon_delete" ON salons
  FOR DELETE USING (
    owner_id = (select auth.uid())
  );

-- =============================================================================
-- salon_id を持つテーブル: get_user_salon_ids() 使用
-- =============================================================================

-- customers
DROP POLICY IF EXISTS "Salon owners can manage their customers" ON customers;
CREATE POLICY "Users can manage their salon customers" ON customers
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- treatment_menus
DROP POLICY IF EXISTS "Salon owners can manage their menus" ON treatment_menus;
CREATE POLICY "Users can manage their salon menus" ON treatment_menus
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- treatment_records
DROP POLICY IF EXISTS "Salon owners can manage their records" ON treatment_records;
CREATE POLICY "Users can manage their salon records" ON treatment_records
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- appointments
DROP POLICY IF EXISTS "Salon owners can manage their appointments" ON appointments;
CREATE POLICY "Users can manage their salon appointments" ON appointments
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- purchases
DROP POLICY IF EXISTS "Salon owners can manage their purchases" ON purchases;
CREATE POLICY "Users can manage their salon purchases" ON purchases
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- course_tickets
DROP POLICY IF EXISTS "Salon owners can manage their course tickets" ON course_tickets;
CREATE POLICY "Users can manage their salon course tickets" ON course_tickets
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- products
DROP POLICY IF EXISTS "Salon owners can manage their products" ON products;
CREATE POLICY "Users can manage their salon products" ON products
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- inventory_logs
DROP POLICY IF EXISTS "Salon owners can manage their inventory logs" ON inventory_logs;
CREATE POLICY "Users can manage their salon inventory logs" ON inventory_logs
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- import_batches
DROP POLICY IF EXISTS "salon_owner_import_batches" ON import_batches;
CREATE POLICY "Users can manage their salon import batches" ON import_batches
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- salon_line_configs
DROP POLICY IF EXISTS "Salon owners can manage their line configs" ON salon_line_configs;
CREATE POLICY "Users can manage their salon line configs" ON salon_line_configs
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- customer_line_links
DROP POLICY IF EXISTS "Salon owners can manage their customer line links" ON customer_line_links;
CREATE POLICY "Users can manage their salon customer line links" ON customer_line_links
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- line_message_logs
DROP POLICY IF EXISTS "Salon owners can manage their line message logs" ON line_message_logs;
CREATE POLICY "Users can manage their salon line message logs" ON line_message_logs
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- counseling_sheets (個別ポリシーを統合)
DROP POLICY IF EXISTS "salon_owner_select" ON counseling_sheets;
DROP POLICY IF EXISTS "salon_owner_insert" ON counseling_sheets;
DROP POLICY IF EXISTS "salon_owner_update" ON counseling_sheets;
DROP POLICY IF EXISTS "salon_owner_delete" ON counseling_sheets;
CREATE POLICY "Users can manage their salon counseling sheets" ON counseling_sheets
  FOR ALL USING (salon_id IN (SELECT get_user_salon_ids()))
  WITH CHECK (salon_id IN (SELECT get_user_salon_ids()));

-- =============================================================================
-- 多段JOINテーブル: get_user_salon_ids() で簡略化
-- =============================================================================

-- treatment_photos
DROP POLICY IF EXISTS "Salon owners can manage treatment photos" ON treatment_photos;
DROP POLICY IF EXISTS "Salon owners can update their treatment photos" ON treatment_photos;
CREATE POLICY "Users can manage their salon treatment photos" ON treatment_photos
  FOR ALL USING (
    treatment_record_id IN (
      SELECT id FROM treatment_records WHERE salon_id IN (SELECT get_user_salon_ids())
    )
  )
  WITH CHECK (
    treatment_record_id IN (
      SELECT id FROM treatment_records WHERE salon_id IN (SELECT get_user_salon_ids())
    )
  );

-- treatment_record_menus
DROP POLICY IF EXISTS "Salon owners can manage treatment record menus" ON treatment_record_menus;
CREATE POLICY "Users can manage their salon treatment record menus" ON treatment_record_menus
  FOR ALL USING (
    treatment_record_id IN (
      SELECT id FROM treatment_records WHERE salon_id IN (SELECT get_user_salon_ids())
    )
  )
  WITH CHECK (
    treatment_record_id IN (
      SELECT id FROM treatment_records WHERE salon_id IN (SELECT get_user_salon_ids())
    )
  );

-- appointment_menus
DROP POLICY IF EXISTS "Salon owners can manage appointment menus" ON appointment_menus;
CREATE POLICY "Users can manage their salon appointment menus" ON appointment_menus
  FOR ALL USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE salon_id IN (SELECT get_user_salon_ids())
    )
  )
  WITH CHECK (
    appointment_id IN (
      SELECT id FROM appointments WHERE salon_id IN (SELECT get_user_salon_ids())
    )
  );

-- =============================================================================
-- Storage: treatment-photos バケット
-- =============================================================================
DROP POLICY IF EXISTS "Salon owners can upload treatment photos" ON storage.objects;
DROP POLICY IF EXISTS "Salon owners can view their treatment photos" ON storage.objects;
DROP POLICY IF EXISTS "Salon owners can delete their treatment photos" ON storage.objects;

CREATE POLICY "Users can upload treatment photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'treatment-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM salons WHERE owner_id = (select auth.uid())
      UNION
      SELECT salon_id::text FROM staff WHERE auth_user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Users can view their treatment photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'treatment-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM salons WHERE owner_id = (select auth.uid())
      UNION
      SELECT salon_id::text FROM staff WHERE auth_user_id = (select auth.uid()) AND is_active = true
    )
  );

CREATE POLICY "Users can delete their treatment photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'treatment-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM salons WHERE owner_id = (select auth.uid())
      UNION
      SELECT salon_id::text FROM staff WHERE auth_user_id = (select auth.uid()) AND is_active = true
    )
  );
