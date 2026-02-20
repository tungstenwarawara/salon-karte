-- Phase 6-2: カルテへの物販・回数券購入の統合
-- purchases と course_tickets に treatment_record_id カラムを追加し、
-- カルテ作成時に同時入力できるようにする

-- 物販をカルテに紐づけ
ALTER TABLE purchases
  ADD COLUMN treatment_record_id UUID REFERENCES treatment_records(id) ON DELETE SET NULL;
CREATE INDEX idx_purchases_treatment_record_id ON purchases(treatment_record_id);

-- 回数券購入をカルテに紐づけ
ALTER TABLE course_tickets
  ADD COLUMN treatment_record_id UUID REFERENCES treatment_records(id) ON DELETE SET NULL;
CREATE INDEX idx_course_tickets_treatment_record_id ON course_tickets(treatment_record_id);

-- record_product_sale RPCにtreatment_record_idパラメータ追加
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
  v_remaining_stock bigint;
BEGIN
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id AND salon_id = p_salon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '商品が見つかりません';
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
    'remaining_stock', v_remaining_stock
  );
END;
$$;
