-- 予約メニュー中間テーブル（複数メニュー対応）
CREATE TABLE appointment_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  menu_name_snapshot TEXT NOT NULL,
  price_snapshot INTEGER,
  duration_minutes_snapshot INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_appointment_menus_appointment_id ON appointment_menus(appointment_id);
CREATE INDEX idx_appointment_menus_menu_id ON appointment_menus(menu_id);

-- RLS
ALTER TABLE appointment_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage appointment menus"
  ON appointment_menus FOR ALL
  USING (
    appointment_id IN (
      SELECT a.id FROM appointments a
      JOIN salons s ON a.salon_id = s.id
      WHERE s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    appointment_id IN (
      SELECT a.id FROM appointments a
      JOIN salons s ON a.salon_id = s.id
      WHERE s.owner_id = auth.uid()
    )
  );

-- 既存の予約データを中間テーブルにバックフィル
INSERT INTO appointment_menus (appointment_id, menu_id, menu_name_snapshot, price_snapshot, duration_minutes_snapshot, sort_order)
SELECT
  a.id,
  a.menu_id,
  a.menu_name_snapshot,
  tm.price,
  tm.duration_minutes,
  0
FROM appointments a
LEFT JOIN treatment_menus tm ON a.menu_id = tm.id
WHERE a.menu_id IS NOT NULL AND a.menu_name_snapshot IS NOT NULL;
