-- LINE連携: 3テーブル作成（salon_line_configs, customer_line_links, line_message_logs）

-- =============================================================================
-- salon_line_configs: サロンのLINE公式アカウント設定（1サロン1設定）
-- =============================================================================
CREATE TABLE salon_line_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  channel_id text NOT NULL,
  channel_secret_encrypted text NOT NULL,
  channel_access_token_encrypted text NOT NULL,
  webhook_secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  reminder_enabled boolean NOT NULL DEFAULT true,
  confirmation_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salon_line_configs_salon_id_unique UNIQUE (salon_id)
);

-- =============================================================================
-- customer_line_links: 顧客-LINEユーザー紐付け
-- =============================================================================
CREATE TABLE customer_line_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  line_user_id text NOT NULL,
  display_name text,
  picture_url text,
  is_following boolean NOT NULL DEFAULT true,
  linked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_line_links_salon_line_user UNIQUE (salon_id, line_user_id)
);

-- =============================================================================
-- line_message_logs: LINE送信ログ（監査・デバッグ用）
-- =============================================================================
CREATE TABLE line_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_line_link_id uuid REFERENCES customer_line_links(id) ON DELETE SET NULL,
  message_type text NOT NULL CHECK (message_type IN ('reminder', 'confirmation', 'test')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  related_appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- インデックス
-- =============================================================================
CREATE INDEX idx_salon_line_configs_salon_id ON salon_line_configs(salon_id);
CREATE INDEX idx_salon_line_configs_webhook_secret ON salon_line_configs(webhook_secret);
CREATE INDEX idx_customer_line_links_salon_id ON customer_line_links(salon_id);
CREATE INDEX idx_customer_line_links_customer_id ON customer_line_links(customer_id);
CREATE INDEX idx_customer_line_links_line_user_id ON customer_line_links(line_user_id);
CREATE INDEX idx_line_message_logs_salon_id ON line_message_logs(salon_id);
CREATE INDEX idx_line_message_logs_related_appointment_id ON line_message_logs(related_appointment_id);

-- =============================================================================
-- updated_at トリガー（既存の update_updated_at 関数を再利用）
-- =============================================================================
CREATE TRIGGER set_salon_line_configs_updated_at
  BEFORE UPDATE ON salon_line_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_customer_line_links_updated_at
  BEFORE UPDATE ON customer_line_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- RLS有効化 + ポリシー
-- =============================================================================
ALTER TABLE salon_line_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_line_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage their line configs" ON salon_line_configs
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));

CREATE POLICY "Salon owners can manage their customer line links" ON customer_line_links
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));

CREATE POLICY "Salon owners can manage their line message logs" ON line_message_logs
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())))
  WITH CHECK (salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid())));
