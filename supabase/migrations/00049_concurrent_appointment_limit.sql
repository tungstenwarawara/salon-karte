-- 同時予約数上限チェック対応のトリガー更新
-- サロンの booking_settings.max_concurrent_appointments でサロン全体の同時予約数を制限

CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_max_concurrent int;
  v_concurrent_count int;
BEGIN
  -- キャンセル済みは対象外
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- 終了時間がない場合はチェック不可
  IF NEW.end_time IS NULL THEN
    RETURN NEW;
  END IF;

  -- サロンの同時予約上限を取得（デフォルト1）
  SELECT COALESCE(
    (booking_settings->>'max_concurrent_appointments')::int,
    1
  ) INTO v_max_concurrent
  FROM salons
  WHERE id = NEW.salon_id;

  -- サロン全体で時間帯が重複する予約数をカウント
  SELECT COUNT(*) INTO v_concurrent_count
  FROM appointments
  WHERE salon_id = NEW.salon_id
    AND appointment_date = NEW.appointment_date
    AND status != 'cancelled'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND start_time < NEW.end_time
    AND end_time > NEW.start_time;

  IF v_concurrent_count >= v_max_concurrent THEN
    RAISE EXCEPTION 'この時間帯の予約数が上限（%件）に達しています', v_max_concurrent;
  END IF;

  RETURN NEW;
END;
$$;

-- booking_settings の列デフォルトを更新（新規サロン向け）
ALTER TABLE salons
ALTER COLUMN booking_settings
SET DEFAULT '{"same_day_enabled": true, "lead_time_minutes": 0, "max_concurrent_appointments": 1}'::jsonb;
