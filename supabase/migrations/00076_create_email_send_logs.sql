-- オンボーディングメール（Day3 / Day7 / Day14）の二重送信防止用ログテーブル
-- 1サロン × 1メール種別 で1回だけ送るために UNIQUE 制約を設ける

CREATE TABLE email_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  -- 例: 'day3_no_customer' / 'day7_no_record' / 'day14_no_second_record'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (salon_id, email_type)
);

CREATE INDEX idx_email_send_logs_salon_id ON email_send_logs(salon_id);

-- RLS: cron は service role で動くため SELECT 不要だが、念のためサロンオーナーは自分のログを見られる
ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can read their own email logs"
  ON email_send_logs FOR SELECT
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- service role からの INSERT/UPDATE は RLS バイパスのため別途ポリシー不要

COMMENT ON TABLE email_send_logs IS 'オンボーディングメール等の二重送信防止用ログ';
COMMENT ON COLUMN email_send_logs.email_type IS 'メール種別。day3_no_customer / day7_no_record / day14_no_second_record など';
