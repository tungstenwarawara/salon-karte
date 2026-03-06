-- Stripe Webhook の冪等性を保証するための処理済みイベントテーブル
CREATE TABLE stripe_processed_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- 古いイベントを自動削除（30日経過後）
CREATE INDEX idx_stripe_events_processed_at ON stripe_processed_events(processed_at);

-- RLS: サービスロールキーのみアクセス（Webhook API は admin client を使用）
ALTER TABLE stripe_processed_events ENABLE ROW LEVEL SECURITY;
