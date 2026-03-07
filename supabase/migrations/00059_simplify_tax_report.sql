-- COGS（売上原価）計算をアプリから撤廃
-- 理由: 在庫評価(base_cost_price)と仕入実額(unit_cost_price)の混在で不正確
-- 棚卸資産の評価方法は会計ソフトの領域
-- アプリは正確な生データ（売上・仕入実額・在庫数量）の提供に特化する

DROP FUNCTION IF EXISTS get_tax_report(uuid, integer);

CREATE FUNCTION get_tax_report(
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
  v_total_purchases bigint;
  v_monthly_purchases jsonb;
  v_closing_stock_value bigint;
  v_closing_details jsonb;
BEGIN
  v_year_start := make_date(p_year, 1, 1);
  v_year_end := make_date(p_year, 12, 31);

  -- 当年仕入合計（実額: inventory_logs.unit_cost_price）
  SELECT COALESCE(SUM(quantity * COALESCE(unit_cost_price, 0)), 0)
  INTO v_total_purchases
  FROM inventory_logs
  WHERE salon_id = p_salon_id
    AND log_type = 'purchase_in'
    AND logged_at BETWEEN v_year_start AND v_year_end;

  -- 月別仕入金額（実額）
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_monthly_purchases
  FROM (
    SELECT
      EXTRACT(MONTH FROM logged_at)::integer AS month,
      SUM(quantity * COALESCE(unit_cost_price, 0)) AS amount
    FROM inventory_logs
    WHERE salon_id = p_salon_id
      AND log_type = 'purchase_in'
      AND logged_at BETWEEN v_year_start AND v_year_end
    GROUP BY EXTRACT(MONTH FROM logged_at)
    ORDER BY month
  ) sub;

  -- 期末在庫の参考評価額（base_cost_price基準の概算）
  SELECT COALESCE(SUM(sub.stock * sub.base_cost_price), 0)
  INTO v_closing_stock_value
  FROM (
    SELECT
      il.product_id,
      p.base_cost_price,
      SUM(il.quantity) AS stock
    FROM inventory_logs il
    JOIN products p ON p.id = il.product_id
    WHERE il.salon_id = p_salon_id
      AND il.logged_at <= v_year_end
    GROUP BY il.product_id, p.base_cost_price
  ) sub
  WHERE sub.stock > 0;

  -- 期末在庫明細
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_closing_details
  FROM (
    SELECT
      p.name AS product_name,
      SUM(il.quantity) AS stock,
      p.base_cost_price AS unit_price,
      SUM(il.quantity) * p.base_cost_price AS total_value
    FROM inventory_logs il
    JOIN products p ON p.id = il.product_id
    WHERE il.salon_id = p_salon_id
      AND il.logged_at <= v_year_end
    GROUP BY p.id, p.name, p.base_cost_price
    HAVING SUM(il.quantity) > 0
    ORDER BY p.name
  ) sub;

  RETURN jsonb_build_object(
    'year', p_year,
    'total_purchases', v_total_purchases,
    'monthly_purchases', v_monthly_purchases,
    'closing_stock_value', v_closing_stock_value,
    'closing_stock_details', v_closing_details
  );
END;
$$;
