-- Phase 1.5: テスターFBによる施術記録フィールド追加
-- ラベル汎用化は UI側で対応（DBカラム名 skin_condition_before は変更せず）
ALTER TABLE treatment_records
  ADD COLUMN IF NOT EXISTS conversation_notes TEXT,
  ADD COLUMN IF NOT EXISTS caution_notes TEXT;
