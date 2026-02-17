-- 予約管理テーブル
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES treatment_menus(id),
  menu_name_snapshot TEXT,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  source TEXT DEFAULT 'direct' CHECK (source IN ('hotpepper', 'phone', 'line', 'direct', 'other')),
  memo TEXT,
  treatment_record_id UUID REFERENCES treatment_records(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_appointments_salon_id ON appointments(salon_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_salon_date ON appointments(salon_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_salon_date_status ON appointments(salon_id, appointment_date, status);

-- updated_atトリガー
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage their appointments"
  ON appointments FOR ALL
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );
