-- Phase 6-3: 前受金（未消化回数券残高）を取得するRPC
-- status='active' の回数券について、未消化セッション分の金額を按分計算
-- price が NULL の回数券は除外

CREATE FUNCTION get_deferred_revenue(
  p_salon_id uuid
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    SUM(
      price * (total_sessions - used_sessions) / total_sessions
    ),
    0
  )::bigint
  FROM course_tickets
  WHERE salon_id = p_salon_id
    AND status = 'active'
    AND price IS NOT NULL
    AND total_sessions > 0;
$$;
