-- 来店分析RPCに record_type='visit' フィルタを追加
-- visit 以外（product_only, cancelled, memo）は来店扱いしない
--
-- 修正対象:
--   - get_customer_visit_summary
--   - get_customer_ltv_summary
--   - get_monthly_new_vs_returning
--   - get_lapsed_customers
--
-- 不変RPC（修正不要）:
--   - get_monthly_sales_summary（支払発生で集計）
--   - get_tax_report（支払発生で集計）
--   - get_deferred_revenue（回数券基準）
--   - get_menu_ranking（メニュー中間テーブル経由・visit以外には中間レコードができない）

-- 1. get_customer_visit_summary
CREATE OR REPLACE FUNCTION get_customer_visit_summary(p_salon_id uuid)
RETURNS TABLE(customer_id uuid, visit_count bigint, last_visit_date date)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    tr.customer_id,
    COUNT(*)::bigint AS visit_count,
    MAX(tr.treatment_date) AS last_visit_date
  FROM treatment_records tr
  WHERE tr.salon_id = p_salon_id
    AND tr.record_type = 'visit'
  GROUP BY tr.customer_id;
$$;

-- 2. get_customer_ltv_summary
CREATE OR REPLACE FUNCTION get_customer_ltv_summary(p_salon_id uuid)
RETURNS TABLE(
  customer_id uuid,
  last_name text,
  first_name text,
  visit_count bigint,
  treatment_revenue bigint,
  purchase_revenue bigint,
  ticket_revenue bigint,
  first_visit_date date,
  last_visit_date date
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH visit_stats AS (
    SELECT
      tr.customer_id,
      COUNT(DISTINCT tr.id) AS visit_count,
      SUM(CASE WHEN trm.payment_type IN ('cash', 'credit') THEN COALESCE(trm.price_snapshot, 0) ELSE 0 END) AS treatment_revenue,
      MIN(tr.treatment_date) AS first_visit_date,
      MAX(tr.treatment_date) AS last_visit_date
    FROM treatment_records tr
    LEFT JOIN treatment_record_menus trm ON trm.treatment_record_id = tr.id
    WHERE tr.salon_id = p_salon_id
      AND tr.record_type = 'visit'
    GROUP BY tr.customer_id
  ),
  purchase_stats AS (
    SELECT customer_id, COALESCE(SUM(total_price), 0) AS purchase_revenue
    FROM purchases
    WHERE salon_id = p_salon_id
    GROUP BY customer_id
  ),
  ticket_stats AS (
    SELECT customer_id, COALESCE(SUM(price), 0) AS ticket_revenue
    FROM course_tickets
    WHERE salon_id = p_salon_id
    GROUP BY customer_id
  )
  SELECT
    c.id AS customer_id,
    c.last_name,
    c.first_name,
    COALESCE(v.visit_count, 0)::bigint,
    COALESCE(v.treatment_revenue, 0)::bigint,
    COALESCE(ps.purchase_revenue, 0)::bigint,
    COALESCE(ts.ticket_revenue, 0)::bigint,
    v.first_visit_date,
    v.last_visit_date
  FROM customers c
  LEFT JOIN visit_stats v ON v.customer_id = c.id
  LEFT JOIN purchase_stats ps ON ps.customer_id = c.id
  LEFT JOIN ticket_stats ts ON ts.customer_id = c.id
  WHERE c.salon_id = p_salon_id
    AND c.graduated_at IS NULL
  ORDER BY (COALESCE(v.treatment_revenue, 0) + COALESCE(ps.purchase_revenue, 0) + COALESCE(ts.ticket_revenue, 0)) DESC;
$$;

-- 3. get_monthly_new_vs_returning
CREATE OR REPLACE FUNCTION get_monthly_new_vs_returning(p_salon_id uuid, p_year integer)
RETURNS TABLE(month integer, new_customers bigint, returning_customers bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH months AS (SELECT generate_series(1, 12) AS m),
  first_visits AS (
    SELECT customer_id, MIN(treatment_date) AS first_date
    FROM treatment_records
    WHERE salon_id = p_salon_id
      AND record_type = 'visit'
    GROUP BY customer_id
  ),
  monthly_visitors AS (
    SELECT DISTINCT
      EXTRACT(MONTH FROM tr.treatment_date)::int AS m,
      tr.customer_id,
      (EXTRACT(YEAR FROM fv.first_date) = p_year
       AND EXTRACT(MONTH FROM fv.first_date) = EXTRACT(MONTH FROM tr.treatment_date)) AS is_new
    FROM treatment_records tr
    JOIN first_visits fv ON fv.customer_id = tr.customer_id
    WHERE tr.salon_id = p_salon_id
      AND tr.record_type = 'visit'
      AND EXTRACT(YEAR FROM tr.treatment_date) = p_year
  )
  SELECT
    months.m,
    COUNT(DISTINCT CASE WHEN mv.is_new THEN mv.customer_id END)::bigint AS new_customers,
    COUNT(DISTINCT CASE WHEN NOT mv.is_new THEN mv.customer_id END)::bigint AS returning_customers
  FROM months
  LEFT JOIN monthly_visitors mv ON mv.m = months.m
  GROUP BY months.m
  ORDER BY months.m;
$$;

-- 4. get_lapsed_customers
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
    AND tr.record_type = 'visit'
  GROUP BY c.id, c.last_name, c.first_name
  HAVING (CURRENT_DATE - MAX(tr.treatment_date)) >= p_days_threshold
  ORDER BY days_since DESC;
$$;
