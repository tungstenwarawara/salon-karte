-- ========================================
-- セキュリティ修正: 全RPC関数にsearch_path設定
-- Supabase security linter対応
-- ========================================

-- update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- get_lapsed_customers
CREATE OR REPLACE FUNCTION get_lapsed_customers(
  p_salon_id uuid,
  p_days_threshold integer DEFAULT 60
)
RETURNS TABLE (
  id uuid,
  last_name text,
  first_name text,
  last_visit_date date,
  days_since integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.last_name,
    c.first_name,
    MAX(tr.treatment_date)::date AS last_visit_date,
    (CURRENT_DATE - MAX(tr.treatment_date))::integer AS days_since
  FROM customers c
  INNER JOIN treatment_records tr ON tr.customer_id = c.id
  WHERE c.salon_id = p_salon_id
    AND c.graduated_at IS NULL
  GROUP BY c.id, c.last_name, c.first_name
  HAVING (CURRENT_DATE - MAX(tr.treatment_date)) >= p_days_threshold
  ORDER BY days_since DESC;
$$;

-- use_course_ticket_session
CREATE OR REPLACE FUNCTION use_course_ticket_session(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
BEGIN
  SELECT * INTO v_ticket
  FROM course_tickets
  WHERE id = p_ticket_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active ticket not found';
  END IF;

  IF v_ticket.used_sessions >= v_ticket.total_sessions THEN
    RAISE EXCEPTION 'All sessions already used';
  END IF;

  UPDATE course_tickets
  SET
    used_sessions = used_sessions + 1,
    status = CASE
      WHEN used_sessions + 1 >= total_sessions THEN 'completed'
      ELSE 'active'
    END
  WHERE id = p_ticket_id;

  RETURN jsonb_build_object(
    'used_sessions', v_ticket.used_sessions + 1,
    'status', CASE
      WHEN v_ticket.used_sessions + 1 >= v_ticket.total_sessions THEN 'completed'
      ELSE 'active'
    END
  );
END;
$$;

-- get_inventory_summary
CREATE OR REPLACE FUNCTION get_inventory_summary(p_salon_id uuid)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  category text,
  base_sell_price integer,
  base_cost_price integer,
  reorder_point integer,
  is_active boolean,
  current_stock bigint,
  stock_value bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    p.base_sell_price,
    p.base_cost_price,
    p.reorder_point,
    p.is_active,
    COALESCE(SUM(il.quantity), 0) AS current_stock,
    COALESCE(SUM(il.quantity), 0) * p.base_cost_price AS stock_value
  FROM products p
  LEFT JOIN inventory_logs il ON il.product_id = p.id
  WHERE p.salon_id = p_salon_id
    AND p.is_active = true
  GROUP BY p.id, p.name, p.category, p.base_sell_price, p.base_cost_price, p.reorder_point, p.is_active
  ORDER BY p.name;
$$;

-- record_product_sale
CREATE OR REPLACE FUNCTION record_product_sale(
  p_salon_id uuid,
  p_customer_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_sell_price integer,
  p_purchase_date date DEFAULT CURRENT_DATE,
  p_memo text DEFAULT NULL
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
    product_id, cost_price, sell_price
  ) VALUES (
    p_salon_id, p_customer_id, p_purchase_date, v_product.name,
    p_quantity, p_sell_price, v_total_price, p_memo,
    p_product_id, v_product.base_cost_price, p_sell_price
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

-- get_tax_report
CREATE OR REPLACE FUNCTION get_tax_report(
  p_salon_id uuid,
  p_year integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_year_start date;
  v_year_end date;
  v_prev_year_end date;
  v_opening_stock_value bigint;
  v_closing_stock_value bigint;
  v_total_purchases bigint;
  v_monthly_purchases jsonb;
  v_closing_details jsonb;
BEGIN
  v_year_start := make_date(p_year, 1, 1);
  v_year_end := make_date(p_year, 12, 31);
  v_prev_year_end := make_date(p_year - 1, 12, 31);

  SELECT COALESCE(SUM(sub.stock * sub.base_cost_price), 0)
  INTO v_opening_stock_value
  FROM (
    SELECT il.product_id, p.base_cost_price, SUM(il.quantity) AS stock
    FROM inventory_logs il
    JOIN products p ON p.id = il.product_id
    WHERE il.salon_id = p_salon_id AND il.logged_at <= v_prev_year_end
    GROUP BY il.product_id, p.base_cost_price
  ) sub
  WHERE sub.stock > 0;

  SELECT COALESCE(SUM(sub.stock * sub.base_cost_price), 0)
  INTO v_closing_stock_value
  FROM (
    SELECT il.product_id, p.base_cost_price, SUM(il.quantity) AS stock
    FROM inventory_logs il
    JOIN products p ON p.id = il.product_id
    WHERE il.salon_id = p_salon_id AND il.logged_at <= v_year_end
    GROUP BY il.product_id, p.base_cost_price
  ) sub
  WHERE sub.stock > 0;

  SELECT COALESCE(SUM(quantity * COALESCE(unit_cost_price, 0)), 0)
  INTO v_total_purchases
  FROM inventory_logs
  WHERE salon_id = p_salon_id AND log_type = 'purchase_in'
    AND logged_at BETWEEN v_year_start AND v_year_end;

  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_monthly_purchases
  FROM (
    SELECT EXTRACT(MONTH FROM logged_at)::integer AS month,
           SUM(quantity * COALESCE(unit_cost_price, 0)) AS amount
    FROM inventory_logs
    WHERE salon_id = p_salon_id AND log_type = 'purchase_in'
      AND logged_at BETWEEN v_year_start AND v_year_end
    GROUP BY EXTRACT(MONTH FROM logged_at)
    ORDER BY month
  ) sub;

  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_closing_details
  FROM (
    SELECT p.name AS product_name, SUM(il.quantity) AS stock,
           p.base_cost_price AS unit_price,
           SUM(il.quantity) * p.base_cost_price AS total_value
    FROM inventory_logs il
    JOIN products p ON p.id = il.product_id
    WHERE il.salon_id = p_salon_id AND il.logged_at <= v_year_end
    GROUP BY p.id, p.name, p.base_cost_price
    HAVING SUM(il.quantity) > 0
    ORDER BY p.name
  ) sub;

  RETURN jsonb_build_object(
    'year', p_year,
    'opening_stock_value', v_opening_stock_value,
    'closing_stock_value', v_closing_stock_value,
    'total_purchases', v_total_purchases,
    'cost_of_goods_sold', v_opening_stock_value + v_total_purchases - v_closing_stock_value,
    'monthly_purchases', v_monthly_purchases,
    'closing_stock_details', v_closing_details
  );
END;
$$;
