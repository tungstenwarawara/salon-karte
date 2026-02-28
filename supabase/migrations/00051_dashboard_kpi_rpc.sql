-- ダッシュボードKPI: 今月・先月の売上と来店数を1回のクエリで取得
CREATE FUNCTION get_dashboard_kpi(
  p_salon_id uuid
)
RETURNS TABLE(
  current_month_revenue bigint,
  previous_month_revenue bigint,
  current_month_visits bigint,
  previous_month_visits bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH
  date_range AS (
    SELECT
      date_trunc('month', CURRENT_DATE) AS current_start,
      date_trunc('month', CURRENT_DATE) + interval '1 month' AS current_end,
      date_trunc('month', CURRENT_DATE) - interval '1 month' AS previous_start
  ),
  -- 施術売上（cash/credit のみ = 実収入）
  treatment_rev AS (
    SELECT
      CASE
        WHEN tr.treatment_date >= dr.current_start AND tr.treatment_date < dr.current_end THEN 'current'
        ELSE 'previous'
      END AS period,
      COALESCE(SUM(trm.price_snapshot), 0) AS total
    FROM date_range dr,
         treatment_records tr
    JOIN treatment_record_menus trm ON trm.treatment_record_id = tr.id
    WHERE tr.salon_id = p_salon_id
      AND tr.treatment_date >= dr.previous_start
      AND tr.treatment_date < dr.current_end
      AND trm.payment_type IN ('cash', 'credit')
    GROUP BY 1
  ),
  -- 物販売上（payment_type列なし、全件計上）
  product_rev AS (
    SELECT
      CASE
        WHEN p.purchase_date >= dr.current_start AND p.purchase_date < dr.current_end THEN 'current'
        ELSE 'previous'
      END AS period,
      COALESCE(SUM(p.total_price), 0) AS total
    FROM date_range dr,
         purchases p
    WHERE p.salon_id = p_salon_id
      AND p.purchase_date >= dr.previous_start
      AND p.purchase_date < dr.current_end
    GROUP BY 1
  ),
  -- 来店数（カルテ数 = 来店数）
  visits AS (
    SELECT
      CASE
        WHEN tr.treatment_date >= dr.current_start AND tr.treatment_date < dr.current_end THEN 'current'
        ELSE 'previous'
      END AS period,
      COUNT(*) AS cnt
    FROM date_range dr,
         treatment_records tr
    WHERE tr.salon_id = p_salon_id
      AND tr.treatment_date >= dr.previous_start
      AND tr.treatment_date < dr.current_end
    GROUP BY 1
  )
  SELECT
    (COALESCE((SELECT total FROM treatment_rev WHERE period = 'current'), 0)
     + COALESCE((SELECT total FROM product_rev WHERE period = 'current'), 0))::bigint,
    (COALESCE((SELECT total FROM treatment_rev WHERE period = 'previous'), 0)
     + COALESCE((SELECT total FROM product_rev WHERE period = 'previous'), 0))::bigint,
    COALESCE((SELECT cnt FROM visits WHERE period = 'current'), 0)::bigint,
    COALESCE((SELECT cnt FROM visits WHERE period = 'previous'), 0)::bigint;
$$;
