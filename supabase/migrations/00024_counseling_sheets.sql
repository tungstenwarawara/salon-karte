-- カウンセリングシート（デジタル問診票）
CREATE TABLE counseling_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted')),
  responses jsonb,
  submitted_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS有効化
ALTER TABLE counseling_sheets ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: サロンオーナーのみ
CREATE POLICY "salon_owner_select" ON counseling_sheets
  FOR SELECT USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "salon_owner_insert" ON counseling_sheets
  FOR INSERT WITH CHECK (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "salon_owner_update" ON counseling_sheets
  FOR UPDATE USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- updated_atトリガー
CREATE TRIGGER set_counseling_sheets_updated_at
  BEFORE UPDATE ON counseling_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- インデックス
CREATE INDEX idx_counseling_sheets_token ON counseling_sheets(token);
CREATE INDEX idx_counseling_sheets_customer_id ON counseling_sheets(customer_id);
