-- カルテ-メニュー中間テーブル（複数メニュー + 支払方法対応）
-- appointment_menus と同じ構造 + payment_type / ticket_id を追加
CREATE TABLE treatment_record_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_record_id UUID NOT NULL REFERENCES treatment_records(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  menu_name_snapshot TEXT NOT NULL,
  price_snapshot INTEGER,
  duration_minutes_snapshot INTEGER,
  payment_type TEXT NOT NULL DEFAULT 'cash'
    CHECK (payment_type IN ('cash', 'credit', 'ticket', 'service')),
  ticket_id UUID REFERENCES course_tickets(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_treatment_record_menus_record_id ON treatment_record_menus(treatment_record_id);
CREATE INDEX idx_treatment_record_menus_menu_id ON treatment_record_menus(menu_id);
CREATE INDEX idx_treatment_record_menus_ticket_id ON treatment_record_menus(ticket_id);

-- RLS
ALTER TABLE treatment_record_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage treatment record menus"
  ON treatment_record_menus FOR ALL
  USING (
    treatment_record_id IN (
      SELECT tr.id FROM treatment_records tr
      JOIN salons s ON tr.salon_id = s.id
      WHERE s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    treatment_record_id IN (
      SELECT tr.id FROM treatment_records tr
      JOIN salons s ON tr.salon_id = s.id
      WHERE s.owner_id = auth.uid()
    )
  );

-- 既存のカルテデータをバックフィル（menu_id が設定されているものだけ）
INSERT INTO treatment_record_menus (
  treatment_record_id, menu_id, menu_name_snapshot, price_snapshot,
  duration_minutes_snapshot, payment_type, sort_order
)
SELECT
  tr.id,
  tr.menu_id,
  COALESCE(tr.menu_name_snapshot, tm.name, '不明なメニュー'),
  tm.price,
  tm.duration_minutes,
  'cash',
  0
FROM treatment_records tr
LEFT JOIN treatment_menus tm ON tr.menu_id = tm.id
WHERE tr.menu_id IS NOT NULL AND tr.menu_name_snapshot IS NOT NULL;
