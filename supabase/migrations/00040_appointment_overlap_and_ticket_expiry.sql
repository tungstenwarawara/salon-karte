-- C-1: 予約重複チェックのDB制約（トリガー方式）
-- クライアント側チェックのみでは並行リクエストで重複が発生しうる

CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- キャンセル済みは対象外
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- 終了時間がない場合はチェック不可
  IF NEW.end_time IS NULL THEN
    RETURN NEW;
  END IF;

  -- 重複チェック
  -- staff_idがある場合: 同じスタッフの予約のみチェック
  -- staff_idがNULLの場合: サロン全体の予約をチェック（個人サロン想定）
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE salon_id = NEW.salon_id
      AND appointment_date = NEW.appointment_date
      AND status != 'cancelled'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        NEW.staff_id IS NULL
        OR staff_id = NEW.staff_id
      )
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'この時間帯には既に予約があります';
  END IF;

  RETURN NEW;
END;
$$;

-- INSERT と UPDATE の両方にトリガーを設定
DROP TRIGGER IF EXISTS trg_check_appointment_overlap ON appointments;
CREATE TRIGGER trg_check_appointment_overlap
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_overlap();


-- C-2: 回数券の有効期限チェックを use_course_ticket_session に追加
-- 既存のパラメータ(p_ticket_id uuid)は同じなので CREATE OR REPLACE でOK
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
    RAISE EXCEPTION 'Active ticket not found';
  END IF;

  IF v_ticket.used_sessions >= v_ticket.total_sessions THEN
    RAISE EXCEPTION 'All sessions already used';
  END IF;

  -- 有効期限チェック（expiry_date が設定されている場合のみ）
  IF v_ticket.expiry_date IS NOT NULL AND v_ticket.expiry_date < CURRENT_DATE THEN
    -- 期限切れの場合はステータスを expired に更新
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
