-- 取り込みバッチの更新済みレコード数を返す関数
-- 取り消し前の警告表示に使用

CREATE OR REPLACE FUNCTION check_import_batch_modifications(
  p_batch_id UUID,
  p_salon_id UUID
)
RETURNS TABLE(modified_count INTEGER, total_count INTEGER, batch_type TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_batch_type TEXT;
  v_batch_salon_id UUID;
  v_entity_ids UUID[];
  v_batch_created_at TIMESTAMPTZ;
  v_modified INTEGER := 0;
  v_total INTEGER := 0;
BEGIN
  -- バッチ情報を取得
  SELECT ib.batch_type, ib.salon_id, ib.entity_ids, ib.created_at
    INTO v_batch_type, v_batch_salon_id, v_entity_ids, v_batch_created_at
    FROM import_batches ib
   WHERE ib.id = p_batch_id;

  IF v_batch_salon_id IS NULL THEN
    RAISE EXCEPTION '取り込み履歴が見つかりません';
  END IF;

  IF v_batch_salon_id != p_salon_id THEN
    RAISE EXCEPTION '権限がありません';
  END IF;

  IF v_entity_ids IS NULL OR array_length(v_entity_ids, 1) IS NULL THEN
    RETURN QUERY SELECT 0, 0, v_batch_type;
    RETURN;
  END IF;

  v_total := array_length(v_entity_ids, 1);

  -- 種別ごとに updated_at > created_at のレコードをカウント
  IF v_batch_type = 'records' THEN
    SELECT COUNT(*)::INTEGER INTO v_modified
      FROM treatment_records
     WHERE id = ANY(v_entity_ids)
       AND salon_id = p_salon_id
       AND updated_at > v_batch_created_at;

  ELSIF v_batch_type = 'customers' THEN
    SELECT COUNT(*)::INTEGER INTO v_modified
      FROM customers
     WHERE id = ANY(v_entity_ids)
       AND salon_id = p_salon_id
       AND updated_at > v_batch_created_at;

  ELSIF v_batch_type = 'products' THEN
    SELECT COUNT(*)::INTEGER INTO v_modified
      FROM products
     WHERE id = ANY(v_entity_ids)
       AND salon_id = p_salon_id
       AND updated_at > v_batch_created_at;
  END IF;

  RETURN QUERY SELECT v_modified, v_total, v_batch_type;
END;
$$;
