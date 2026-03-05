-- 回数券・物販テーブルに payment_type カラムを追加
-- 会計CSV出力で正確な仕訳（現金/売掛金）を生成するために必要

-- course_tickets に payment_type 追加（デフォルト: cash）
ALTER TABLE course_tickets
  ADD COLUMN payment_type text NOT NULL DEFAULT 'cash'
  CHECK (payment_type IN ('cash', 'credit'));

-- purchases に payment_type 追加（デフォルト: cash）
ALTER TABLE purchases
  ADD COLUMN payment_type text NOT NULL DEFAULT 'cash'
  CHECK (payment_type IN ('cash', 'credit'));

-- record_product_sale RPC を更新（payment_type パラメータ追加）
-- パラメータ数が変わるため旧シグネチャをDROPしてから再作成
DROP FUNCTION IF EXISTS record_product_sale(uuid, uuid, uuid, integer, integer, date, text, uuid);

CREATE OR REPLACE FUNCTION record_product_sale(
  p_salon_id uuid,
  p_customer_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_sell_price integer,
  p_purchase_date date DEFAULT CURRENT_DATE,
  p_memo text DEFAULT NULL,
  p_treatment_record_id uuid DEFAULT NULL,
  p_payment_type text DEFAULT 'cash'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_product record;
  v_purchase_id uuid;
  v_total_price integer;
  v_current_stock bigint;
  v_remaining_stock bigint;
  v_stock_warning boolean := false;
BEGIN
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id AND salon_id = p_salon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '商品が見つかりません';
  END IF;

  -- 販売前の在庫を確認
  SELECT COALESCE(SUM(quantity), 0) INTO v_current_stock
  FROM inventory_logs
  WHERE product_id = p_product_id;

  -- 在庫不足の場合は警告フラグを立てる（ブロックはしない）
  IF v_current_stock < p_quantity THEN
    v_stock_warning := true;
  END IF;

  v_total_price := p_sell_price * p_quantity;

  INSERT INTO purchases (
    salon_id, customer_id, purchase_date, item_name,
    quantity, unit_price, total_price, memo,
    product_id, cost_price, sell_price, treatment_record_id, payment_type
  ) VALUES (
    p_salon_id, p_customer_id, p_purchase_date, v_product.name,
    p_quantity, p_sell_price, v_total_price, p_memo,
    p_product_id, v_product.base_cost_price, p_sell_price, p_treatment_record_id, p_payment_type
  )
  RETURNING id INTO v_purchase_id;

  INSERT INTO inventory_logs (
    salon_id, product_id, log_type, quantity,
    unit_cost_price, unit_sell_price,
    related_purchase_id, logged_at
  ) VALUES (
    p_salon_id, p_product_id, 'sale_out', -p_quantity,
    v_product.base_cost_price, p_sell_price,
    v_purchase_id, p_purchase_date
  );

  SELECT COALESCE(SUM(quantity), 0) INTO v_remaining_stock
  FROM inventory_logs
  WHERE product_id = p_product_id;

  RETURN jsonb_build_object(
    'purchase_id', v_purchase_id,
    'remaining_stock', v_remaining_stock,
    'stock_warning', v_stock_warning
  );
END;
$$;
