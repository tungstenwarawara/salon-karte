-- カルテ記録種別（record_type）を追加
-- 顧客イベント（来店・物販のみ・キャンセル・メモ）を treatment_records に一元化する
--
-- 設計判断: docs および CLAUDE.md「確認済みの設計判断」を参照
-- - visit: 通常の来店カルテ（既存全レコードが該当）
-- - product_only: 物販のみ購入（来店なし）
-- - cancelled: 当日キャンセル等（appointments と双方向連動）
-- - memo: 日付付き備忘録

-- 1. ENUM 型を作成
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_type') THEN
    CREATE TYPE record_type AS ENUM ('visit', 'product_only', 'cancelled', 'memo');
  END IF;
END$$;

-- 2. カラム追加（既存全レコードは DEFAULT 'visit' になる）
ALTER TABLE treatment_records
  ADD COLUMN IF NOT EXISTS record_type record_type NOT NULL DEFAULT 'visit',
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

-- 3. インデックス
-- 来店分析で record_type='visit' でフィルタする際に効くインデックス
CREATE INDEX IF NOT EXISTS idx_treatment_records_record_type
  ON treatment_records(salon_id, record_type);

-- 予約紐付けカルテ検索用（NULLは除外）
CREATE INDEX IF NOT EXISTS idx_treatment_records_appointment_id
  ON treatment_records(appointment_id)
  WHERE appointment_id IS NOT NULL;

-- 4. UNIQUE 制約: 1予約に対するキャンセル記録は最大1件
CREATE UNIQUE INDEX IF NOT EXISTS uq_treatment_records_cancelled_per_appointment
  ON treatment_records(appointment_id)
  WHERE record_type = 'cancelled' AND appointment_id IS NOT NULL;

-- 5. コメント
COMMENT ON COLUMN treatment_records.record_type IS '顧客イベント種別: visit=来店, product_only=物販のみ, cancelled=キャンセル, memo=備忘録';
COMMENT ON COLUMN treatment_records.appointment_id IS 'キャンセル記録の場合、紐づく予約ID（双方向連動用）';
