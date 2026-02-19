-- 営業時間設定を salons テーブルに追加
ALTER TABLE salons
ADD COLUMN business_hours JSONB DEFAULT '{
  "monday":    {"is_open": true,  "open_time": "10:00", "close_time": "20:00"},
  "tuesday":   {"is_open": true,  "open_time": "10:00", "close_time": "20:00"},
  "wednesday": {"is_open": true,  "open_time": "10:00", "close_time": "20:00"},
  "thursday":  {"is_open": true,  "open_time": "10:00", "close_time": "20:00"},
  "friday":    {"is_open": true,  "open_time": "10:00", "close_time": "20:00"},
  "saturday":  {"is_open": true,  "open_time": "10:00", "close_time": "20:00"},
  "sunday":    {"is_open": false, "open_time": "10:00", "close_time": "20:00"}
}'::jsonb;
