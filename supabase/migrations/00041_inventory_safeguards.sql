-- H-1/H-3: 在庫ログの整合性チェック
-- stock_in は正数、sale_out は負数、return_in は正数を保証
ALTER TABLE inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_quantity_sign_check;
ALTER TABLE inventory_logs ADD CONSTRAINT inventory_logs_quantity_sign_check
  CHECK (
    (log_type = 'stock_in' AND quantity > 0)
    OR (log_type = 'sale_out' AND quantity < 0)
    OR (log_type = 'return_in' AND quantity > 0)
    OR (log_type NOT IN ('stock_in', 'sale_out', 'return_in'))
  );

-- record_product_sale に在庫警告を追加（在庫不足でもブロックせず警告のみ）
-- 個人サロンでは入庫ログ忘れが頻繁なため、販売をブロックすると業務に支障
CREATE OR REPLACE FUNCTION record_product_sale(
  p_salon_id uuid,
  p_customer_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_sell_price integer,
  p_purchase_date date DEFAULT CURRENT_DATE,
  p_memo text DEFAULT NULL,
  p_treatment_record_id uuid DEFAULT NULL
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
    product_id, cost_price, sell_price, treatment_record_id
  ) VALUES (
    p_salon_id, p_customer_id, p_purchase_date, v_product.name,
    p_quantity, p_sell_price, v_total_price, p_memo,
    p_product_id, v_product.base_cost_price, p_sell_price, p_treatment_record_id
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
