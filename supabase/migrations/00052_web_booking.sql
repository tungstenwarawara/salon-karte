-- Web予約機能: salons に booking_slug と booking_enabled を追加
-- booking_slug: 公開予約ページの URL パス（例: /book/hair-salon-yuki）
-- booking_enabled: 予約ページの公開/非公開フラグ

ALTER TABLE salons
ADD COLUMN booking_slug TEXT UNIQUE,
ADD COLUMN booking_enabled BOOLEAN NOT NULL DEFAULT false;

-- slug フォーマット制約: 英小文字・数字・ハイフン、3-50文字
ALTER TABLE salons
ADD CONSTRAINT salons_booking_slug_format
CHECK (booking_slug IS NULL OR booking_slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$');

-- slug による高速ルックアップ用インデックス（NULL除外）
CREATE UNIQUE INDEX idx_salons_booking_slug ON salons(booking_slug) WHERE booking_slug IS NOT NULL;

-- appointments.source に 'web' を追加
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_source_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_source_check
  CHECK (source IN ('hotpepper', 'phone', 'line', 'direct', 'other', 'web'));
