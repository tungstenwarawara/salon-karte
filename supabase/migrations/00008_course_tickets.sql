-- コースチケット/回数券管理テーブル
CREATE TABLE course_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  ticket_name TEXT NOT NULL,
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  price INTEGER,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_course_tickets_salon_id ON course_tickets(salon_id);
CREATE INDEX idx_course_tickets_customer_id ON course_tickets(customer_id);
CREATE INDEX idx_course_tickets_status ON course_tickets(status);

-- updated_atトリガー
CREATE TRIGGER update_course_tickets_updated_at
  BEFORE UPDATE ON course_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE course_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage their course tickets"
  ON course_tickets FOR ALL
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
