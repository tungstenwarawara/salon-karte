-- CSV取り込み履歴テーブル + 一括取り消し機能

-- テーブル作成
CREATE TABLE import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  batch_type TEXT NOT NULL CHECK (batch_type IN ('customers', 'products', 'records')),
  filename TEXT,
  total_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  entity_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_import_batches_salon_created
  ON import_batches (salon_id, created_at DESC);

-- RLS
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_import_batches" ON import_batches
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- 一括取り消しRPC関数
CREATE OR REPLACE FUNCTION undo_import_batch(
  p_batch_id UUID,
  p_salon_id UUID
)
RETURNS TABLE(deleted_count INTEGER, batch_type TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_batch_type TEXT;
  v_batch_salon_id UUID;
  v_entity_ids UUID[];
  v_deleted INTEGER := 0;
  v_dep_count INTEGER;
BEGIN
  -- バッチ情報を取得・検証
  SELECT ib.batch_type, ib.salon_id, ib.entity_ids
    INTO v_batch_type, v_batch_salon_id, v_entity_ids
    FROM import_batches ib
   WHERE ib.id = p_batch_id;

  IF v_batch_salon_id IS NULL THEN
    RAISE EXCEPTION '取り込み履歴が見つかりません';
  END IF;

  IF v_batch_salon_id != p_salon_id THEN
    RAISE EXCEPTION '権限がありません';
  END IF;

  IF v_entity_ids IS NULL OR array_length(v_entity_ids, 1) IS NULL THEN
    RAISE EXCEPTION '取り消し対象のデータがありません';
  END IF;

  -- 種別ごとの削除処理
  IF v_batch_type = 'records' THEN
    -- 施術履歴: 関連テーブルを先に削除
    DELETE FROM purchases
     WHERE treatment_record_id = ANY(v_entity_ids);

    DELETE FROM treatment_record_menus
     WHERE treatment_record_id = ANY(v_entity_ids);

    DELETE FROM treatment_photos
     WHERE treatment_record_id = ANY(v_entity_ids);

    DELETE FROM treatment_records
     WHERE id = ANY(v_entity_ids) AND salon_id = p_salon_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

  ELSIF v_batch_type = 'customers' THEN
    -- 顧客: 紐づくカルテがあるか確認
    SELECT COUNT(*) INTO v_dep_count
      FROM treatment_records
     WHERE customer_id = ANY(v_entity_ids);

    IF v_dep_count > 0 THEN
      RAISE EXCEPTION 'この顧客データに紐づくカルテが%件あるため取り消しできません。先にカルテを削除してください。', v_dep_count;
    END IF;

    -- 予約も確認
    SELECT COUNT(*) INTO v_dep_count
      FROM appointments
     WHERE customer_id = ANY(v_entity_ids);

    IF v_dep_count > 0 THEN
      RAISE EXCEPTION 'この顧客データに紐づく予約が%件あるため取り消しできません。先に予約を削除してください。', v_dep_count;
    END IF;

    DELETE FROM customers
     WHERE id = ANY(v_entity_ids) AND salon_id = p_salon_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

  ELSIF v_batch_type = 'products' THEN
    -- 商品: 紐づく物販があるか確認
    SELECT COUNT(*) INTO v_dep_count
      FROM purchases
     WHERE product_id = ANY(v_entity_ids);

    IF v_dep_count > 0 THEN
      RAISE EXCEPTION 'この商品データに紐づく物販記録が%件あるため取り消しできません。', v_dep_count;
    END IF;

    DELETE FROM products
     WHERE id = ANY(v_entity_ids) AND salon_id = p_salon_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
  END IF;

  -- バッチレコード自体を削除
  DELETE FROM import_batches WHERE id = p_batch_id;

  RETURN QUERY SELECT v_deleted, v_batch_type;
END;
$$;
