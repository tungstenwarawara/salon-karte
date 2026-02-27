-- カウンセリングテンプレート複数対応 + 匿名リンク対応
-- 1サロン最大2テンプレート（アプリ側で制御）
-- customer_id nullable化で新規顧客向け匿名リンクを実現

-- =============================================================================
-- 1. counseling_templates テーブル作成
-- =============================================================================
CREATE TABLE counseling_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'カウンセリングシート',
  template jsonb NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. RLS + ポリシー
-- =============================================================================
ALTER TABLE counseling_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_select" ON counseling_templates
  FOR SELECT USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "salon_owner_insert" ON counseling_templates
  FOR INSERT WITH CHECK (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "salon_owner_update" ON counseling_templates
  FOR UPDATE USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "salon_owner_delete" ON counseling_templates
  FOR DELETE USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- =============================================================================
-- 3. updated_at トリガー
-- =============================================================================
CREATE TRIGGER set_counseling_templates_updated_at
  BEFORE UPDATE ON counseling_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 4. counseling_sheets に template_id カラム追加
-- =============================================================================
ALTER TABLE counseling_sheets
  ADD COLUMN template_id uuid REFERENCES counseling_templates(id) ON DELETE SET NULL;

-- =============================================================================
-- 5. counseling_sheets.customer_id を nullable に変更（匿名リンク対応）
-- =============================================================================
ALTER TABLE counseling_sheets ALTER COLUMN customer_id DROP NOT NULL;

-- =============================================================================
-- 6. 既存データ移行（salons.counseling_template → counseling_templates）
-- =============================================================================
INSERT INTO counseling_templates (salon_id, name, template, is_default)
SELECT id, 'カウンセリングシート', counseling_template, true
FROM salons
WHERE counseling_template IS NOT NULL;

-- =============================================================================
-- 7. インデックス
-- =============================================================================
CREATE INDEX idx_counseling_templates_salon_id ON counseling_templates(salon_id);
CREATE INDEX idx_counseling_sheets_template_id ON counseling_sheets(template_id);
CREATE INDEX idx_counseling_sheets_anonymous
  ON counseling_sheets(salon_id, status) WHERE customer_id IS NULL;
