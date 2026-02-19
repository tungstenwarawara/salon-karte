-- 物販・購入管理テーブル
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_purchases_salon_id ON purchases(salon_id);
CREATE INDEX idx_purchases_customer_id ON purchases(customer_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);

-- updated_atトリガー
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage their purchases"
  ON purchases FOR ALL
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
