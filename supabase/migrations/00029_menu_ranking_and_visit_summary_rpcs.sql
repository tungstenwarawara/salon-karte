-- メニュー人気ランキング集計（analytics用）
-- JS側のGROUP BYをDB側に移行
CREATE OR REPLACE FUNCTION get_menu_ranking(p_salon_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE(menu_name text, count bigint, revenue bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    trm.menu_name_snapshot AS menu_name,
    COUNT(*)::bigint AS count,
    COALESCE(SUM(
      CASE WHEN trm.payment_type IN ('cash', 'credit')
        THEN trm.price_snapshot
        ELSE 0
      END
    ), 0)::bigint AS revenue
  FROM treatment_record_menus trm
  JOIN treatment_records tr ON tr.id = trm.treatment_record_id
  WHERE tr.salon_id = p_salon_id
  GROUP BY trm.menu_name_snapshot
  ORDER BY count DESC
  LIMIT p_limit;
$$;

-- 顧客別来店統計（顧客一覧用）
-- JS側のGROUP BYをDB側に移行
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
  GROUP BY tr.customer_id;
$$;
