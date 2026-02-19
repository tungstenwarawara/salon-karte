-- ========================================
-- セキュリティ・整合性修正マイグレーション
-- ========================================

-- 1. [Critical] get_lapsed_customers: SECURITY DEFINER → SECURITY INVOKER
--    SECURITY DEFINERはRLSをバイパスするため、任意のsalon_idで他サロンのデータを取得可能だった
DROP FUNCTION IF EXISTS get_lapsed_customers(uuid, integer);

CREATE OR REPLACE FUNCTION get_lapsed_customers(p_salon_id uuid, p_days_threshold integer DEFAULT 60)
RETURNS TABLE (
  id uuid,
  last_name text,
  first_name text,
  last_visit_date date,
  days_since integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    c.id,
    c.last_name,
    c.first_name,
    MAX(tr.treatment_date)::date AS last_visit_date,
    (CURRENT_DATE - MAX(tr.treatment_date)::date) AS days_since
  FROM customers c
  INNER JOIN treatment_records tr ON tr.customer_id = c.id
  WHERE c.salon_id = p_salon_id
  GROUP BY c.id, c.last_name, c.first_name
  HAVING (CURRENT_DATE - MAX(tr.treatment_date)::date) >= p_days_threshold
  ORDER BY days_since DESC;
$$;

-- 2. [Critical] NOT NULL制約追加（owner_id, salon_id, customer_id）
--    NULLが入るとRLSポリシーが機能しなくなるため必須
ALTER TABLE salons ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE customers ALTER COLUMN salon_id SET NOT NULL;
ALTER TABLE treatment_records ALTER COLUMN customer_id SET NOT NULL;
ALTER TABLE treatment_records ALTER COLUMN salon_id SET NOT NULL;

-- 3. [Critical] コースチケットのアトミック消化用RPC関数
--    クライアント側のread-then-writeの競合状態を防止
CREATE OR REPLACE FUNCTION use_course_ticket_session(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_ticket record;
  v_new_used integer;
  v_new_status text;
BEGIN
  -- 行ロックで排他制御
  SELECT * INTO v_ticket
  FROM course_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'チケットが見つかりません';
  END IF;

  IF v_ticket.status != 'active' THEN
    RAISE EXCEPTION 'このチケットは使用できません（ステータス: %）', v_ticket.status;
  END IF;

  IF v_ticket.used_sessions >= v_ticket.total_sessions THEN
    RAISE EXCEPTION 'このチケットは全回数を消化済みです';
  END IF;

  v_new_used := v_ticket.used_sessions + 1;
  v_new_status := CASE WHEN v_new_used >= v_ticket.total_sessions THEN 'completed' ELSE 'active' END;

  UPDATE course_tickets
  SET used_sessions = v_new_used,
      status = v_new_status
  WHERE id = p_ticket_id;

  RETURN jsonb_build_object('used_sessions', v_new_used, 'status', v_new_status);
END;
$$;

-- 4. [High] appointments.menu_id に ON DELETE SET NULL を追加
--    メニュー削除時に予約が壊れないようにする
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_menu_id_fkey;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_menu_id_fkey
  FOREIGN KEY (menu_id) REFERENCES treatment_menus(id) ON DELETE SET NULL;

-- 5. [High] appointments.treatment_record_id に ON DELETE SET NULL を追加
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_treatment_record_id_fkey;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_treatment_record_id_fkey
  FOREIGN KEY (treatment_record_id) REFERENCES treatment_records(id) ON DELETE SET NULL;

-- 6. [High] course_tickets に CHECK制約追加
ALTER TABLE course_tickets
  ADD CONSTRAINT check_used_sessions_limit
  CHECK (used_sessions >= 0 AND used_sessions <= total_sessions);

-- 7. [Medium] Storage UPDATE ポリシー追加
--    写真のメタデータ更新に必要
CREATE POLICY "Salon owners can update their treatment photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'treatment-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.salons WHERE owner_id = auth.uid()
    )
  );

-- 8. [Medium] salons テーブルにオーナーごとのユニーク制約
--    1ユーザー1サロンを保証（現在のビジネスモデル）
CREATE UNIQUE INDEX IF NOT EXISTS idx_salons_unique_owner
  ON salons(owner_id);
