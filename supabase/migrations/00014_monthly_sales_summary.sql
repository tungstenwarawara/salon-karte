-- ========================================
-- 月別売上集計RPC関数
-- 本番適用済み: 20260219075545_00012_monthly_sales_summary
-- ========================================

CREATE OR REPLACE FUNCTION get_monthly_sales_summary(p_salon_id uuid, p_year integer)
RETURNS TABLE(month integer, treatment_sales bigint, product_sales bigint, ticket_sales bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH months AS (SELECT generate_series(1, 12) AS m),
  treatment AS (
    SELECT EXTRACT(MONTH FROM a.appointment_date)::int AS m, COALESCE(SUM(am.price_snapshot),0) AS total
    FROM appointments a JOIN appointment_menus am ON am.appointment_id = a.id
    WHERE a.salon_id = p_salon_id AND a.status = 'completed'
      AND EXTRACT(YEAR FROM a.appointment_date) = p_year
    GROUP BY 1
  ),
  products AS (
    SELECT EXTRACT(MONTH FROM purchase_date)::int AS m, COALESCE(SUM(total_price),0) AS total
    FROM purchases WHERE salon_id = p_salon_id AND EXTRACT(YEAR FROM purchase_date) = p_year GROUP BY 1
  ),
  tickets AS (
    SELECT EXTRACT(MONTH FROM purchase_date)::int AS m, COALESCE(SUM(price),0) AS total
    FROM course_tickets WHERE salon_id = p_salon_id AND EXTRACT(YEAR FROM purchase_date) = p_year GROUP BY 1
  )
  SELECT months.m, COALESCE(t.total,0)::bigint, COALESCE(p.total,0)::bigint, COALESCE(tk.total,0)::bigint
  FROM months LEFT JOIN treatment t ON t.m = months.m
    LEFT JOIN products p ON p.m = months.m LEFT JOIN tickets tk ON tk.m = months.m
  ORDER BY 1;
$$;
