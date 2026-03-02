-- salons に plan_type カラム追加
ALTER TABLE salons ADD COLUMN plan_type TEXT NOT NULL DEFAULT 'free'
  CHECK (plan_type IN ('free', 'standard'));

-- subscriptions テーブル作成
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id),
  UNIQUE(stripe_customer_id)
);

-- RLS 有効化
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー: オーナーのみ参照可
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- サービスロール用: Webhook からの INSERT/UPDATE に必要
-- （Webhook は service_role_key を使うため RLS をバイパスするが、明示的に定義）

-- updated_at トリガー
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
