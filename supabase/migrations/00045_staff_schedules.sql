-- Phase 2: スタッフシフト管理（default_schedule + overrides）

-- 1. staff に週間デフォルトスケジュールを追加（NULLならサロン営業時間フォールバック）
ALTER TABLE staff ADD COLUMN default_schedule JSONB DEFAULT NULL;

-- 2. 日付指定のスケジュール変更テーブル
CREATE TABLE staff_schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_working BOOLEAN NOT NULL DEFAULT false,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  memo TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(staff_id, override_date)
);

CREATE INDEX idx_staff_schedule_overrides_staff_date
  ON staff_schedule_overrides(staff_id, override_date);
CREATE INDEX idx_staff_schedule_overrides_salon_date
  ON staff_schedule_overrides(salon_id, override_date);

-- updated_at トリガー（既存の update_updated_at 関数を再利用）
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON staff_schedule_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. RLS
ALTER TABLE staff_schedule_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_schedule_overrides_select" ON staff_schedule_overrides
  FOR SELECT USING (
    salon_id IN (SELECT get_user_salon_ids())
  );

CREATE POLICY "staff_schedule_overrides_insert" ON staff_schedule_overrides
  FOR INSERT WITH CHECK (
    salon_id IN (SELECT get_owned_salon_ids())
  );

CREATE POLICY "staff_schedule_overrides_update" ON staff_schedule_overrides
  FOR UPDATE USING (
    salon_id IN (SELECT get_owned_salon_ids())
  );

CREATE POLICY "staff_schedule_overrides_delete" ON staff_schedule_overrides
  FOR DELETE USING (
    salon_id IN (SELECT get_owned_salon_ids())
  );
