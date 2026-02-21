-- ========================================
-- 分析用RPC関数（顧客LTV + 新規/リピーター推移）
-- ========================================

-- 1. 顧客LTVサマリー
-- 顧客ごとの来店回数・施術売上・物販売上・回数券売上を集計
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

-- 2. 月別 新規/リピーター集計
-- 顧客の初来店月を基準にnew/returningを判定
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
