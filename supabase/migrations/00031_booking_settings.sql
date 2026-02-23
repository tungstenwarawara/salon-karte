-- 予約受付制限設定（当日予約不可・リードタイム）
ALTER TABLE salons
ADD COLUMN booking_settings JSONB DEFAULT '{"same_day_enabled": true, "lead_time_minutes": 0}'::jsonb;
