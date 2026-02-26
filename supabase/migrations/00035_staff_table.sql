-- Phase 1: スタッフ基盤 — staffテーブル作成 + 既存オーナーデータ移行
-- 既存テーブルへの変更なし。新テーブル追加のみ。

-- staffテーブル作成
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 制約: Phase 1 では 1ユーザー = 1サロン
ALTER TABLE staff ADD CONSTRAINT staff_auth_user_id_unique UNIQUE (auth_user_id);
-- 同サロン内のメール重複防止
ALTER TABLE staff ADD CONSTRAINT staff_salon_email_unique UNIQUE (salon_id, email);

-- インデックス
CREATE INDEX idx_staff_salon_id ON staff(salon_id);
CREATE INDEX idx_staff_auth_user_id ON staff(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_salon_active ON staff(salon_id, is_active);

-- updated_at トリガー
CREATE TRIGGER set_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS有効化
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- staffテーブルRLS
-- SELECT: サロンオーナーは全スタッフ、スタッフは自分のレコードのみ
CREATE POLICY "staff_select" ON staff
  FOR SELECT USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid()))
    OR auth_user_id = (select auth.uid())
  );

-- INSERT/UPDATE/DELETE: サロンオーナーのみ
CREATE POLICY "staff_insert" ON staff
  FOR INSERT WITH CHECK (
    salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid()))
  );

CREATE POLICY "staff_update" ON staff
  FOR UPDATE USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid()))
  );

CREATE POLICY "staff_delete" ON staff
  FOR DELETE USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = (select auth.uid()))
  );

-- 既存オーナーのデータ移行
-- salons の owner_id に対応する auth.users から email を取得し、staff レコードを作成
INSERT INTO staff (salon_id, auth_user_id, name, email, role)
SELECT s.id, s.owner_id, 'オーナー', u.email, 'owner'
FROM salons s
JOIN auth.users u ON s.owner_id = u.id;
