-- 1. CHECK制約の修正
-- 旧制約が 'stock_in'（存在しないlog_type）を参照していたバグを修正
-- 'purchase_in' に対する quantity > 0 制約が欠落していた
ALTER TABLE inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_quantity_sign_check;
ALTER TABLE inventory_logs ADD CONSTRAINT inventory_logs_quantity_sign_check
  CHECK (
    (log_type = 'purchase_in' AND quantity > 0)
    OR (log_type = 'return_in' AND quantity > 0)
    OR (log_type = 'sale_out' AND quantity < 0)
    OR (log_type = 'sample_out' AND quantity < 0)
    OR (log_type = 'waste_out' AND quantity < 0)
    OR (log_type = 'adjust')
  );

-- 2. get_tax_report: COGSが負にならないよう補正
-- 棚卸調整(adjust)で在庫設定した場合、仕入額にカウントされず
-- COGS = 期首 + 仕入 - 期末 がマイナスになり得た
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
  v_raw_cogs bigint;
BEGIN
  v_year_start := make_date(p_year, 1, 1);
  v_year_end := make_date(p_year, 12, 31);
  v_prev_year_end := make_date(p_year - 1, 12, 31);

  -- 期首棚卸高（前年末までの在庫数 × 基本仕入価）
  SELECT COALESCE(SUM(sub.stock * sub.base_cost_price), 0)
  INTO v_opening_stock_value
  FROM (
    SELECT
      il.product_id,
      p.base_cost_price,
      SUM(il.quantity) AS stock
    FROM inventory_logs il
    JOIN products p ON p.id = il.product_id
    WHERE il.salon_id = p_salon_id
      AND il.logged_at <= v_prev_year_end
    GROUP BY il.product_id, p.base_cost_price
  ) sub
  WHERE sub.stock > 0;

  -- 期末棚卸高（当年末までの在庫数 × 基本仕入価）
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

  -- 当年仕入合計
  SELECT COALESCE(SUM(quantity * COALESCE(unit_cost_price, 0)), 0)
  INTO v_total_purchases
  FROM inventory_logs
  WHERE salon_id = p_salon_id
    AND log_type = 'purchase_in'
    AND logged_at BETWEEN v_year_start AND v_year_end;

  -- 月別仕入金額
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

  -- 期末棚卸明細
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

  -- COGS計算: 負にならないよう補正
  -- 棚卸調整で在庫を設定した場合、仕入額にカウントされないためマイナスになり得る
  v_raw_cogs := v_opening_stock_value + v_total_purchases - v_closing_stock_value;

  RETURN jsonb_build_object(
    'year', p_year,
    'opening_stock_value', v_opening_stock_value,
    'closing_stock_value', v_closing_stock_value,
    'total_purchases', v_total_purchases,
    'cost_of_goods_sold', GREATEST(v_raw_cogs, 0),
    'cogs_adjusted', v_raw_cogs < 0,
    'monthly_purchases', v_monthly_purchases,
    'closing_stock_details', v_closing_details
  );
END;
$$;
