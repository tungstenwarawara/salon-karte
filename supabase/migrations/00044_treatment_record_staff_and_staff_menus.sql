-- Phase 1: カルテにスタッフ紐づけ + スタッフ別メニュー対応テーブル

-- 1. treatment_records にスタッフを紐づけ
ALTER TABLE treatment_records ADD COLUMN staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;
CREATE INDEX idx_treatment_records_staff_id ON treatment_records(staff_id);

-- 既存レコードをオーナー（staff role='owner'）に割当
UPDATE treatment_records tr
SET staff_id = s.id
FROM staff s
WHERE s.salon_id = tr.salon_id AND s.role = 'owner';

-- 2. スタッフ-メニュー対応テーブル（指名料付き）
CREATE TABLE staff_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES treatment_menus(id) ON DELETE CASCADE,
  nomination_fee INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, menu_id)
);

CREATE INDEX idx_staff_menus_staff_id ON staff_menus(staff_id);
CREATE INDEX idx_staff_menus_menu_id ON staff_menus(menu_id);

ALTER TABLE staff_menus ENABLE ROW LEVEL SECURITY;

-- RLS: get_owned_salon_ids() / get_user_salon_ids() 経由（RLS再帰防止パターン踏襲）
CREATE POLICY "staff_menus_select" ON staff_menus
  FOR SELECT USING (
    staff_id IN (
      SELECT id FROM staff WHERE salon_id IN (SELECT get_user_salon_ids())
    )
  );

CREATE POLICY "staff_menus_insert" ON staff_menus
  FOR INSERT WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE salon_id IN (SELECT get_owned_salon_ids())
    )
  );

CREATE POLICY "staff_menus_update" ON staff_menus
  FOR UPDATE USING (
    staff_id IN (
      SELECT id FROM staff WHERE salon_id IN (SELECT get_owned_salon_ids())
    )
  );

CREATE POLICY "staff_menus_delete" ON staff_menus
  FOR DELETE USING (
    staff_id IN (
      SELECT id FROM staff WHERE salon_id IN (SELECT get_owned_salon_ids())
    )
  );
