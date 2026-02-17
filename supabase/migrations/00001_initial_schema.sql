-- サロン情報
CREATE TABLE salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 顧客情報
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name_kana TEXT,
  first_name_kana TEXT,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  skin_type TEXT,
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 施術メニューマスタ
CREATE TABLE treatment_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  duration_minutes INTEGER,
  price INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 施術記録（カルテ）
CREATE TABLE treatment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  treatment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  menu_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  menu_name_snapshot TEXT,
  treatment_area TEXT,
  products_used TEXT,
  skin_condition_before TEXT,
  notes_after TEXT,
  next_visit_memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 施術写真
CREATE TABLE treatment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_record_id UUID REFERENCES treatment_records(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  photo_type TEXT NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_photos ENABLE ROW LEVEL SECURITY;

-- salons: オーナーは自分のサロンのみアクセス可能
CREATE POLICY "Users can manage their own salons"
  ON salons FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own salon"
  ON salons FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- customers: サロンオーナーは自サロンの顧客のみアクセス可能
CREATE POLICY "Salon owners can manage their customers"
  ON customers FOR ALL
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Salon owners can insert customers"
  ON customers FOR INSERT
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- treatment_menus: サロンオーナーは自サロンのメニューのみアクセス可能
CREATE POLICY "Salon owners can manage their menus"
  ON treatment_menus FOR ALL
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Salon owners can insert menus"
  ON treatment_menus FOR INSERT
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- treatment_records: サロンオーナーは自サロンの施術記録のみアクセス可能
CREATE POLICY "Salon owners can manage their records"
  ON treatment_records FOR ALL
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Salon owners can insert records"
  ON treatment_records FOR INSERT
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- treatment_photos: 施術記録経由でアクセス制御
CREATE POLICY "Salon owners can manage treatment photos"
  ON treatment_photos FOR ALL
  USING (
    treatment_record_id IN (
      SELECT tr.id FROM treatment_records tr
      JOIN salons s ON tr.salon_id = s.id
      WHERE s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Salon owners can insert treatment photos"
  ON treatment_photos FOR INSERT
  WITH CHECK (
    treatment_record_id IN (
      SELECT tr.id FROM treatment_records tr
      JOIN salons s ON tr.salon_id = s.id
      WHERE s.owner_id = auth.uid()
    )
  );

-- ========================================
-- Indexes
-- ========================================

CREATE INDEX idx_salons_owner_id ON salons(owner_id);
CREATE INDEX idx_customers_salon_id ON customers(salon_id);
CREATE INDEX idx_customers_name_kana ON customers(last_name_kana, first_name_kana);
CREATE INDEX idx_treatment_menus_salon_id ON treatment_menus(salon_id);
CREATE INDEX idx_treatment_records_customer_id ON treatment_records(customer_id);
CREATE INDEX idx_treatment_records_salon_id ON treatment_records(salon_id);
CREATE INDEX idx_treatment_records_date ON treatment_records(treatment_date);
CREATE INDEX idx_treatment_photos_record_id ON treatment_photos(treatment_record_id);

-- ========================================
-- Updated_at trigger
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER salons_updated_at
  BEFORE UPDATE ON salons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER treatment_records_updated_at
  BEFORE UPDATE ON treatment_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
