-- 商品別の入出庫履歴を取得するRPC関数
CREATE OR REPLACE FUNCTION get_product_inventory_logs(
  p_salon_id uuid,
  p_product_id uuid,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  log_type text,
  quantity integer,
  unit_cost_price integer,
  reason text,
  logged_at date,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    il.id,
    il.log_type,
    il.quantity,
    il.unit_cost_price,
    il.reason,
    il.logged_at,
    il.created_at
  FROM inventory_logs il
  WHERE il.salon_id = p_salon_id
    AND il.product_id = p_product_id
  ORDER BY il.logged_at DESC, il.created_at DESC
  LIMIT p_limit;
$$;
