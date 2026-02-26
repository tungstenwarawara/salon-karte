-- appointments.staff_id の外部キー制約に ON DELETE SET NULL を追加
-- スタッフ削除時に予約の staff_id が自動で NULL になるようにする
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_staff_id_fkey,
  ADD CONSTRAINT appointments_staff_id_fkey
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;
