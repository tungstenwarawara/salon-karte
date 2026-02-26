-- 予約にスタッフ紐づけ（1予約 = 1スタッフ）
ALTER TABLE appointments ADD COLUMN staff_id UUID REFERENCES staff(id);

CREATE INDEX idx_appointments_staff_id ON appointments(staff_id);

-- 既存予約をオーナー（staff role='owner'）に割当
UPDATE appointments a
SET staff_id = s.id
FROM staff s
WHERE s.salon_id = a.salon_id AND s.role = 'owner';
