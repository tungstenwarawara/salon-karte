-- 回数券の消化回数を手動で調整するRPC関数
-- 操作ミス（二重消化、誤追加等）の修正用

CREATE OR REPLACE FUNCTION adjust_course_ticket_sessions(
  p_ticket_id uuid,
  p_new_used_sessions integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
  v_new_status text;
BEGIN
  -- 排他ロック
  SELECT * INTO v_ticket
  FROM course_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '回数券が見つかりません';
  END IF;

  -- 範囲チェック
  IF p_new_used_sessions < 0 OR p_new_used_sessions > v_ticket.total_sessions THEN
    RAISE EXCEPTION '消化回数は0〜%の範囲で指定してください', v_ticket.total_sessions;
  END IF;

  -- ステータス自動更新
  IF p_new_used_sessions >= v_ticket.total_sessions THEN
    v_new_status := 'completed';
  ELSIF v_ticket.status IN ('cancelled', 'expired') THEN
    -- cancelled/expired はそのまま維持
    v_new_status := v_ticket.status;
  ELSE
    v_new_status := 'active';
  END IF;

  UPDATE course_tickets
  SET
    used_sessions = p_new_used_sessions,
    status = v_new_status
  WHERE id = p_ticket_id;

  RETURN jsonb_build_object(
    'used_sessions', p_new_used_sessions,
    'status', v_new_status
  );
END;
$$;
