-- 商品人気ランキング集計（analytics用）
CREATE OR REPLACE FUNCTION get_product_ranking(p_salon_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE(product_name text, count bigint, revenue bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    p.item_name AS product_name,
    COALESCE(SUM(p.quantity), 0)::bigint AS count,
    COALESCE(SUM(p.total_price), 0)::bigint AS revenue
  FROM purchases p
  WHERE p.salon_id = p_salon_id
  GROUP BY p.item_name
  ORDER BY revenue DESC
  LIMIT p_limit;
$$;
