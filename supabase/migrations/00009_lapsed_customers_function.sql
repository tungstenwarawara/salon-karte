-- 離脱顧客を効率的に取得するDB関数
-- ダッシュボードで全顧客+全施術記録をフェッチする代わりにSQL集計を使用
CREATE OR REPLACE FUNCTION get_lapsed_customers(p_salon_id uuid, p_days_threshold integer DEFAULT 60)
RETURNS TABLE (
  id uuid,
  last_name text,
  first_name text,
  last_visit_date date,
  days_since integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    c.id,
    c.last_name,
    c.first_name,
    MAX(tr.treatment_date)::date AS last_visit_date,
    (CURRENT_DATE - MAX(tr.treatment_date)::date) AS days_since
  FROM customers c
  INNER JOIN treatment_records tr ON tr.customer_id = c.id
  WHERE c.salon_id = p_salon_id
  GROUP BY c.id, c.last_name, c.first_name
  HAVING (CURRENT_DATE - MAX(tr.treatment_date)::date) >= p_days_threshold
  ORDER BY days_since DESC;
$$;
