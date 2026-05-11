-- 残りの単独物販（テストサロン花 + テストサロン）を自動移行
-- SEI は 00071 で個別処理済み。このマイグレーションでは残り8件を処理する。
--
-- 戦略:
--   Step 1: 同日同顧客の既存カルテに紐付け（同日複数なら最古を採用）
--   Step 2: 残った真の単独物販に対し product_only カルテを新規作成して紐付け
--
-- 注意:
--   00071 が先に実行される前提（マイグレーション番号順）
--   SEIに該当行が残らないよう、念のため SEI 完了確認を冒頭で行う

DO $$
DECLARE
  v_sei_remaining int;
  v_initial_standalone int;
  v_after_step1 int;
  v_after_step2 int;
BEGIN
  -- SEI 完了確認（00071 が適用済みであることを保証）
  SELECT COUNT(*) INTO v_sei_remaining
  FROM purchases
  WHERE salon_id = '17ed3123-244b-43ab-936f-74c422982fb3'
    AND treatment_record_id IS NULL;
  IF v_sei_remaining <> 0 THEN
    RAISE EXCEPTION 'SEI standalone purchases must be migrated first (00071). Remaining: %', v_sei_remaining;
  END IF;

  -- 開始時点の単独物販件数
  SELECT COUNT(*) INTO v_initial_standalone
  FROM purchases
  WHERE treatment_record_id IS NULL;
END$$;

-- Step 1: 既存カルテと同日同顧客のものは紐付け
UPDATE purchases p
SET treatment_record_id = (
  SELECT tr.id FROM treatment_records tr
  WHERE tr.salon_id = p.salon_id
    AND tr.customer_id = p.customer_id
    AND tr.treatment_date = p.purchase_date
  ORDER BY tr.created_at ASC
  LIMIT 1
)
WHERE p.treatment_record_id IS NULL
  AND EXISTS (
    SELECT 1 FROM treatment_records tr
    WHERE tr.salon_id = p.salon_id
      AND tr.customer_id = p.customer_id
      AND tr.treatment_date = p.purchase_date
  );

-- Step 2: 残った単独物販に対して product_only カルテを作って紐付け
WITH groups AS (
  SELECT DISTINCT salon_id, customer_id, purchase_date
  FROM purchases
  WHERE treatment_record_id IS NULL
),
new_records AS (
  INSERT INTO treatment_records (salon_id, customer_id, treatment_date, record_type)
  SELECT salon_id, customer_id, purchase_date, 'product_only'
  FROM groups
  RETURNING id, salon_id, customer_id, treatment_date
)
UPDATE purchases p
SET treatment_record_id = nr.id
FROM new_records nr
WHERE p.treatment_record_id IS NULL
  AND p.salon_id = nr.salon_id
  AND p.customer_id = nr.customer_id
  AND p.purchase_date = nr.treatment_date;

-- 最終検証: 単独物販が0件であること
DO $$
DECLARE
  v_remaining int;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM purchases
  WHERE treatment_record_id IS NULL;
  IF v_remaining <> 0 THEN
    RAISE EXCEPTION 'Migration verification failed: % standalone purchases remain', v_remaining;
  END IF;
END$$;
