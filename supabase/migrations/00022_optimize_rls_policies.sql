-- RLSポリシー最適化
-- 1. auth.uid() → (select auth.uid()) で行ごとの再評価を防止（initplan修正）
-- 2. 重複permissiveポリシーの統合（ALLポリシーにWITH CHECK追加 + INSERT専用ポリシー削除）

-- =============================================================================
-- salons
-- =============================================================================
-- 重複INSERT専用ポリシーを削除
DROP POLICY IF EXISTS "Users can insert their own salon" ON salons;
-- ALLポリシーを再作成（initplan修正 + WITH CHECK追加）
DROP POLICY IF EXISTS "Users can manage their own salons" ON salons;
CREATE POLICY "Users can manage their own salons" ON salons
  FOR ALL USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

-- =============================================================================
-- customers
-- =============================================================================
DROP POLICY IF EXISTS "Salon owners can insert customers" ON customers;
DROP POLICY IF EXISTS "Salon owners can manage their customers" ON customers;
CREATE POLICY "Salon owners can manage their customers" ON customers
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));

-- =============================================================================
-- treatment_menus
-- =============================================================================
DROP POLICY IF EXISTS "Salon owners can insert menus" ON treatment_menus;
DROP POLICY IF EXISTS "Salon owners can manage their menus" ON treatment_menus;
CREATE POLICY "Salon owners can manage their menus" ON treatment_menus
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));

-- =============================================================================
-- treatment_records
-- =============================================================================
DROP POLICY IF EXISTS "Salon owners can insert records" ON treatment_records;
DROP POLICY IF EXISTS "Salon owners can manage their records" ON treatment_records;
CREATE POLICY "Salon owners can manage their records" ON treatment_records
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));

-- =============================================================================
-- treatment_photos
-- =============================================================================
DROP POLICY IF EXISTS "Salon owners can insert treatment photos" ON treatment_photos;
DROP POLICY IF EXISTS "Salon owners can manage treatment photos" ON treatment_photos;
CREATE POLICY "Salon owners can manage treatment photos" ON treatment_photos
  FOR ALL USING (treatment_record_id IN (SELECT tr.id FROM treatment_records tr JOIN salons s ON tr.salon_id = s.id WHERE s.owner_id = (select auth.uid())))
  WITH CHECK (treatment_record_id IN (SELECT tr.id FROM treatment_records tr JOIN salons s ON tr.salon_id = s.id WHERE s.owner_id = (select auth.uid())));

-- =============================================================================
-- 以下は重複なし — initplan修正のみ
-- =============================================================================

-- treatment_record_menus
DROP POLICY IF EXISTS "Salon owners can manage treatment record menus" ON treatment_record_menus;
CREATE POLICY "Salon owners can manage treatment record menus" ON treatment_record_menus
  FOR ALL USING (treatment_record_id IN (SELECT tr.id FROM treatment_records tr JOIN salons s ON tr.salon_id = s.id WHERE s.owner_id = (select auth.uid())))
  WITH CHECK (treatment_record_id IN (SELECT tr.id FROM treatment_records tr JOIN salons s ON tr.salon_id = s.id WHERE s.owner_id = (select auth.uid())));

-- appointments
DROP POLICY IF EXISTS "Salon owners can manage their appointments" ON appointments;
CREATE POLICY "Salon owners can manage their appointments" ON appointments
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));

-- appointment_menus
DROP POLICY IF EXISTS "Salon owners can manage appointment menus" ON appointment_menus;
CREATE POLICY "Salon owners can manage appointment menus" ON appointment_menus
  FOR ALL USING (appointment_id IN (SELECT a.id FROM appointments a JOIN salons s ON a.salon_id = s.id WHERE s.owner_id = (select auth.uid())))
  WITH CHECK (appointment_id IN (SELECT a.id FROM appointments a JOIN salons s ON a.salon_id = s.id WHERE s.owner_id = (select auth.uid())));

-- purchases
DROP POLICY IF EXISTS "Salon owners can manage their purchases" ON purchases;
CREATE POLICY "Salon owners can manage their purchases" ON purchases
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));

-- course_tickets
DROP POLICY IF EXISTS "Salon owners can manage their course tickets" ON course_tickets;
CREATE POLICY "Salon owners can manage their course tickets" ON course_tickets
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));

-- products
DROP POLICY IF EXISTS "Salon owners can manage their products" ON products;
CREATE POLICY "Salon owners can manage their products" ON products
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));

-- inventory_logs
DROP POLICY IF EXISTS "Salon owners can manage their inventory logs" ON inventory_logs;
CREATE POLICY "Salon owners can manage their inventory logs" ON inventory_logs
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));
