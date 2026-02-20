-- Phase 6-3: 売上二重計上の修正
-- treatment_sales の集計ソースを appointment_menus → treatment_record_menus に変更
-- payment_type='cash'/'credit' のみを実収入として計上
-- ticket/service は参考表示用に別列として返す

-- 返り値の列数が変わるため、既存関数をDROPしてから再作成
DROP FUNCTION IF EXISTS get_monthly_sales_summary(uuid, integer);

CREATE FUNCTION get_monthly_sales_summary(
  p_salon_id uuid,
  p_year integer
)
RETURNS TABLE(
  month integer,
  treatment_sales bigint,
  product_sales bigint,
  ticket_sales bigint,
  ticket_consumption bigint,
  service_amount bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH months AS (SELECT generate_series(1, 12) AS m),
  -- 施術売上: cash/credit のみ = 実収入
  treatment_revenue AS (
    SELECT
      EXTRACT(MONTH FROM tr.treatment_date)::int AS m,
      COALESCE(SUM(trm.price_snapshot), 0) AS total
    FROM treatment_records tr
    JOIN treatment_record_menus trm ON trm.treatment_record_id = tr.id
    WHERE tr.salon_id = p_salon_id
      AND EXTRACT(YEAR FROM tr.treatment_date) = p_year
      AND trm.payment_type IN ('cash', 'credit')
    GROUP BY 1
  ),
  -- 回数券消化分（参考表示用）
  ticket_used AS (
    SELECT
      EXTRACT(MONTH FROM tr.treatment_date)::int AS m,
      COALESCE(SUM(trm.price_snapshot), 0) AS total
    FROM treatment_records tr
    JOIN treatment_record_menus trm ON trm.treatment_record_id = tr.id
    WHERE tr.salon_id = p_salon_id
      AND EXTRACT(YEAR FROM tr.treatment_date) = p_year
      AND trm.payment_type = 'ticket'
    GROUP BY 1
  ),
  -- サービス分（参考表示用）
  service_given AS (
    SELECT
      EXTRACT(MONTH FROM tr.treatment_date)::int AS m,
      COALESCE(SUM(trm.price_snapshot), 0) AS total
    FROM treatment_records tr
    JOIN treatment_record_menus trm ON trm.treatment_record_id = tr.id
    WHERE tr.salon_id = p_salon_id
      AND EXTRACT(YEAR FROM tr.treatment_date) = p_year
      AND trm.payment_type = 'service'
    GROUP BY 1
  ),
  -- 物販（変更なし）
  products AS (
    SELECT
      EXTRACT(MONTH FROM purchase_date)::int AS m,
      COALESCE(SUM(total_price), 0) AS total
    FROM purchases
    WHERE salon_id = p_salon_id
      AND EXTRACT(YEAR FROM purchase_date) = p_year
    GROUP BY 1
  ),
  -- 回数券販売（変更なし — 購入時点の売上）
  tickets AS (
    SELECT
      EXTRACT(MONTH FROM purchase_date)::int AS m,
      COALESCE(SUM(price), 0) AS total
    FROM course_tickets
    WHERE salon_id = p_salon_id
      AND EXTRACT(YEAR FROM purchase_date) = p_year
    GROUP BY 1
  )
  SELECT
    months.m,
    COALESCE(tr_rev.total, 0)::bigint,
    COALESCE(p.total, 0)::bigint,
    COALESCE(tk.total, 0)::bigint,
    COALESCE(tu.total, 0)::bigint,
    COALESCE(sv.total, 0)::bigint
  FROM months
  LEFT JOIN treatment_revenue tr_rev ON tr_rev.m = months.m
  LEFT JOIN products p ON p.m = months.m
  LEFT JOIN tickets tk ON tk.m = months.m
  LEFT JOIN ticket_used tu ON tu.m = months.m
  LEFT JOIN service_given sv ON sv.m = months.m
  ORDER BY 1;
$$;

-- パフォーマンス用インデックス
CREATE INDEX IF NOT EXISTS idx_treatment_record_menus_payment_type
  ON treatment_record_menus(payment_type);
CREATE INDEX IF NOT EXISTS idx_treatment_records_salon_date
  ON treatment_records(salon_id, treatment_date);
