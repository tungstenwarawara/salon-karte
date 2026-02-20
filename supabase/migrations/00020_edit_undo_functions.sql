-- Phase 6-3a: カルテ編集時の回数券消化修正 + 物販削除の在庫戻し
-- 2つのRPC関数を追加

-- ============================================
-- 1. undo_course_ticket_session
--    回数券消化の取り消し（used_sessionsをデクリメント）
-- ============================================
CREATE OR REPLACE FUNCTION undo_course_ticket_session(p_ticket_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_ticket record;
BEGIN
  -- FOR UPDATE でロック（use_course_ticket_session と同パターン）
  SELECT * INTO v_ticket
  FROM course_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF v_ticket.used_sessions <= 0 THEN
    RAISE EXCEPTION 'No sessions to undo';
  END IF;

  UPDATE course_tickets
  SET
    used_sessions = used_sessions - 1,
    status = 'active'  -- completed でも active に戻す
  WHERE id = p_ticket_id;

  RETURN jsonb_build_object(
    'used_sessions', v_ticket.used_sessions - 1,
    'status', 'active'
  );
END;
$$;

-- ============================================
-- 2. reverse_product_sale
--    物販記録の削除（在庫連動がある場合は return_in ログで在庫を戻す）
-- ============================================
CREATE OR REPLACE FUNCTION reverse_product_sale(p_purchase_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_purchase record;
  v_remaining_stock bigint;
BEGIN
  SELECT * INTO v_purchase
  FROM purchases
  WHERE id = p_purchase_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '物販記録が見つかりません';
  END IF;

  -- 在庫連動がある場合（product_id が設定されている）、戻し入庫ログを作成
  IF v_purchase.product_id IS NOT NULL THEN
    INSERT INTO inventory_logs (
      salon_id, product_id, log_type, quantity,
      unit_cost_price, unit_sell_price,
      reason, related_purchase_id, logged_at
    ) VALUES (
      v_purchase.salon_id,
      v_purchase.product_id,
      'return_in',
      v_purchase.quantity,  -- 正数 = 入庫
      v_purchase.cost_price,
      v_purchase.sell_price,
      '物販取消による在庫戻し',
      v_purchase.id,
      CURRENT_DATE
    );
  END IF;

  -- 物販レコードを削除
  DELETE FROM purchases WHERE id = p_purchase_id;

  -- 残り在庫を返す（在庫連動がある場合のみ）
  IF v_purchase.product_id IS NOT NULL THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_remaining_stock
    FROM inventory_logs
    WHERE product_id = v_purchase.product_id;
  ELSE
    v_remaining_stock := NULL;
  END IF;

  RETURN jsonb_build_object(
    'deleted_purchase_id', p_purchase_id,
    'remaining_stock', v_remaining_stock
  );
END;
$$;
