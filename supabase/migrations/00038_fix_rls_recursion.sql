-- Fix: salons ↔ staff RLS ポリシーの無限再帰を修正
-- 原因: salon_select が staff をクエリ → staff_select が salons をクエリ → salon_select 再評価 → 無限ループ
-- 解決: SECURITY DEFINER 関数で salons クエリ時の RLS を回避し循環を断つ

-- =============================================================================
-- SECURITY DEFINER ヘルパー: salons の RLS を回避してオーナーのサロンIDを返す
-- =============================================================================
CREATE OR REPLACE FUNCTION get_owned_salon_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM salons WHERE owner_id = (select auth.uid())
$$;

-- =============================================================================
-- get_user_salon_ids() を更新: salons 直接クエリ → get_owned_salon_ids() 経由
-- =============================================================================
CREATE OR REPLACE FUNCTION get_user_salon_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT get_owned_salon_ids()
  UNION
  SELECT salon_id FROM staff WHERE auth_user_id = (select auth.uid()) AND is_active = true
$$;

-- =============================================================================
-- staff テーブル RLS 修正: salons 直接クエリ → get_owned_salon_ids() 経由
-- =============================================================================
DROP POLICY IF EXISTS "staff_select" ON staff;
CREATE POLICY "staff_select" ON staff
  FOR SELECT USING (
    salon_id IN (SELECT get_owned_salon_ids())
    OR auth_user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "staff_insert" ON staff;
CREATE POLICY "staff_insert" ON staff
  FOR INSERT WITH CHECK (
    salon_id IN (SELECT get_owned_salon_ids())
  );

DROP POLICY IF EXISTS "staff_update" ON staff;
CREATE POLICY "staff_update" ON staff
  FOR UPDATE USING (
    salon_id IN (SELECT get_owned_salon_ids())
  );

DROP POLICY IF EXISTS "staff_delete" ON staff;
CREATE POLICY "staff_delete" ON staff
  FOR DELETE USING (
    salon_id IN (SELECT get_owned_salon_ids())
  );
