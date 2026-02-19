-- 不定休（臨時休業日）を salons テーブルに追加
-- データ形式: ["2026-03-05", "2026-03-12"] のような日付文字列配列
ALTER TABLE salons
ADD COLUMN salon_holidays JSONB DEFAULT '[]'::jsonb;

-- JSONBバリデーション: 配列であることを保証
ALTER TABLE salons
ADD CONSTRAINT salon_holidays_is_array
CHECK (jsonb_typeof(salon_holidays) = 'array');
