-- キャンセル・変更締切設定を booking_settings のデフォルトに追加
-- change_deadline_hours: 予約の何時間前までキャンセル・変更を受け付けるか（0 = 制限なし）

ALTER TABLE salons
ALTER COLUMN booking_settings
SET DEFAULT '{"same_day_enabled": true, "lead_time_minutes": 0, "max_concurrent_appointments": 1, "change_deadline_hours": 0}'::jsonb;
