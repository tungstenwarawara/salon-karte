-- 期間末解約の予約状態を保持する
--
-- Stripe の Customer Portal で解約すると、サブスクリプションは即座に消えず
-- cancel_at_period_end = true になり、期間末まで有効なまま残る。
-- この状態を保持していなかったため、アプリ側は status='active' のまま
-- 「次回請求日」を表示し続けており、解約したお客様からは
-- 手続きが成功したのか判別できなかった。

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN subscriptions.cancel_at_period_end IS
  '期間末に解約予定か。Stripe の customer.subscription.updated で同期する';
