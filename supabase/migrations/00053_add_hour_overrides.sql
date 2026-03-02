-- 特定日の営業時間上書き（臨時の時短営業・延長営業等）
-- 構造: { "2026-03-02": { "is_open": true, "open_time": "09:00", "close_time": "18:00" } }
ALTER TABLE salons ADD COLUMN IF NOT EXISTS hour_overrides JSONB DEFAULT '{}'::jsonb;
