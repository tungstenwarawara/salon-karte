-- 写真の順序保持カラムを追加
ALTER TABLE treatment_photos ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- 既存データに sort_order を created_at 順で付与（photo_type グループ内）
WITH ordered AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY treatment_record_id, photo_type
      ORDER BY created_at
    ) - 1 AS rn
  FROM treatment_photos
)
UPDATE treatment_photos SET sort_order = ordered.rn
FROM ordered WHERE treatment_photos.id = ordered.id;

COMMENT ON COLUMN treatment_photos.sort_order IS '同一photo_type内での表示順序（0始まり）';
