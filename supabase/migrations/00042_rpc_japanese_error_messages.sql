-- M-2: RPC関数のエラーメッセージを日本語化

-- undo_course_ticket_session: 英語メッセージを日本語に
CREATE OR REPLACE FUNCTION undo_course_ticket_session(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
BEGIN
  SELECT * INTO v_ticket
  FROM course_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '回数券が見つかりません';
  END IF;

  IF v_ticket.used_sessions <= 0 THEN
    RAISE EXCEPTION '取り消す消化回数がありません';
  END IF;

  UPDATE course_tickets
  SET
    used_sessions = used_sessions - 1,
    status = 'active'
  WHERE id = p_ticket_id;

  RETURN jsonb_build_object(
    'used_sessions', v_ticket.used_sessions - 1,
    'status', 'active'
  );
END;
$$;

-- use_course_ticket_session: 英語メッセージを日本語に
CREATE OR REPLACE FUNCTION use_course_ticket_session(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
BEGIN
  SELECT * INTO v_ticket
  FROM course_tickets
  WHERE id = p_ticket_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '有効な回数券が見つかりません';
  END IF;

  IF v_ticket.used_sessions >= v_ticket.total_sessions THEN
    RAISE EXCEPTION 'この回数券は全回数を消化済みです';
  END IF;

  IF v_ticket.expiry_date IS NOT NULL AND v_ticket.expiry_date < CURRENT_DATE THEN
    UPDATE course_tickets SET status = 'expired' WHERE id = p_ticket_id;
    RAISE EXCEPTION 'この回数券は有効期限（%）を過ぎています', v_ticket.expiry_date;
  END IF;

  UPDATE course_tickets
  SET
    used_sessions = used_sessions + 1,
    status = CASE
      WHEN used_sessions + 1 >= total_sessions THEN 'completed'
      ELSE 'active'
    END
  WHERE id = p_ticket_id;

  RETURN jsonb_build_object(
    'used_sessions', v_ticket.used_sessions + 1,
    'status', CASE
      WHEN v_ticket.used_sessions + 1 >= v_ticket.total_sessions THEN 'completed'
      ELSE 'active'
    END
  );
END;
$$;
