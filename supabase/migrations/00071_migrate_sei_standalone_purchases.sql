-- SEI（バスト専門店SEI / 17ed3123-244b-43ab-936f-74c422982fb3）の
-- 単独物販5件を明示的に既存カルテ/新規カルテに紐付ける。
--
-- 調査日: 2026-05-11
-- 根拠: 各 purchase の item_name と既存カルテの notes_after / next_visit_memo の整合性から判断
--
-- 注意:
--   - 旧 ID をハードコード。本番DBで現状確認済み（同日2026-05-11時点）
--   - 適用前に必ず .claude/plans/sei-snapshot-*.sql を取得しておくこと
--   - 適用後、purchases.treatment_record_id IS NULL の SEI レコードが0件であることを確認すること

DO $$
DECLARE
  v_sei_salon_id CONSTANT uuid := '17ed3123-244b-43ab-936f-74c422982fb3';
  v_fa6d_customer_id CONSTANT uuid := 'fa6ddd11-0507-46e1-b321-683c7720def0';
  v_new_record_id uuid;
  v_updated_count int;
  v_remaining_count int;
BEGIN
  -- #7: 331b/2-24 → 既存カルテ 0672ecfd（回数券消化+「クレンジング発注」memo）に紐付け
  UPDATE purchases
  SET treatment_record_id = '0672ecfd-2bb3-48f4-8382-160ff65fb830'
  WHERE id = '7d1d98c8-88da-420a-8dd9-4368004f3c26'
    AND salon_id = v_sei_salon_id
    AND treatment_record_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count <> 1 THEN
    RAISE EXCEPTION 'SEI #7 migration failed: expected 1 row updated, got %', v_updated_count;
  END IF;

  -- #8: 77ec/1-10 → 既存カルテ 6927074f（空カルテ+写真4枚）に紐付け
  UPDATE purchases
  SET treatment_record_id = '6927074f-7874-4676-8fb8-f6d43ee2bdb4'
  WHERE id = 'cc76b59c-dee3-4d15-929f-4230f12d89eb'
    AND salon_id = v_sei_salon_id
    AND treatment_record_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count <> 1 THEN
    RAISE EXCEPTION 'SEI #8 migration failed: expected 1 row updated, got %', v_updated_count;
  END IF;

  -- #9: fa6d/3-1 → 既存カルテ bae549f9（回数券+既存4物販）に紐付け
  UPDATE purchases
  SET treatment_record_id = 'bae549f9-5302-4696-b2d7-db3f7083484b'
  WHERE id = 'c24be6c6-9324-41da-be34-7e7b8c91d811'
    AND salon_id = v_sei_salon_id
    AND treatment_record_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count <> 1 THEN
    RAISE EXCEPTION 'SEI #9 migration failed: expected 1 row updated, got %', v_updated_count;
  END IF;

  -- #10, #11: fa6d/4-15 の物販2件 → 新規 product_only カルテを作って紐付け
  INSERT INTO treatment_records (salon_id, customer_id, treatment_date, record_type)
  VALUES (v_sei_salon_id, v_fa6d_customer_id, '2026-04-15', 'product_only')
  RETURNING id INTO v_new_record_id;

  UPDATE purchases
  SET treatment_record_id = v_new_record_id
  WHERE id IN (
    '430e77a4-3e1e-4cca-bc64-4734cebdcb2b',
    'ae62ac20-5432-4836-a804-f8a55b321ffa'
  )
    AND salon_id = v_sei_salon_id
    AND treatment_record_id IS NULL;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count <> 2 THEN
    RAISE EXCEPTION 'SEI #10-#11 migration failed: expected 2 rows updated, got %', v_updated_count;
  END IF;

  -- 検証: SEIの単独物販が0件になっていること
  SELECT COUNT(*) INTO v_remaining_count
  FROM purchases
  WHERE salon_id = v_sei_salon_id
    AND treatment_record_id IS NULL;
  IF v_remaining_count <> 0 THEN
    RAISE EXCEPTION 'SEI migration verification failed: expected 0 standalone purchases, got %', v_remaining_count;
  END IF;
END$$;
