-- ========================================
-- 在庫管理マイグレーション
-- 商品マスタ・在庫ログ・RPC関数
-- ========================================

-- ----------------------------------------
-- 1. products テーブル（商品マスタ）
-- ----------------------------------------
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  base_sell_price INTEGER NOT NULL DEFAULT 0,
  base_cost_price INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_products_salon_id ON products(salon_id);
CREATE INDEX idx_products_active ON products(salon_id, is_active);

-- updated_atトリガー
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage their products"
  ON products FOR ALL
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- ----------------------------------------
-- 2. inventory_logs テーブル（入出庫ログ）
-- ----------------------------------------
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN (
    'purchase_in',   -- 仕入入庫
    'sale_out',      -- 物販出庫
    'sample_out',    -- サンプル消費
    'waste_out',     -- 廃棄
    'adjust',        -- 棚卸し調整
    'return_in'      -- 返品入庫
  )),
  quantity INTEGER NOT NULL,  -- 正数=入庫、負数=出庫
  unit_cost_price INTEGER,    -- 仕入単価（入庫時）
  unit_sell_price INTEGER,    -- 売価（出庫時）
  reason TEXT,                -- 調整理由メモ
  related_purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_inventory_logs_salon_id ON inventory_logs(salon_id);
CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_logged_at ON inventory_logs(logged_at);
CREATE INDEX idx_inventory_logs_type ON inventory_logs(salon_id, log_type);

-- RLS
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage their inventory logs"
  ON inventory_logs FOR ALL
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- ----------------------------------------
-- 3. purchases テーブル拡張
--    商品マスタとの紐付け + 原価・売価
-- ----------------------------------------
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS cost_price INTEGER;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS sell_price INTEGER;

-- ----------------------------------------
-- 4. get_inventory_summary() RPC
--    全商品の在庫サマリーを取得
-- ----------------------------------------
CREATE OR REPLACE FUNCTION get_inventory_summary(p_salon_id uuid)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  category text,
  base_sell_price integer,
  base_cost_price integer,
  reorder_point integer,
  is_active boolean,
  current_stock bigint,
  stock_value bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    p.base_sell_price,
    p.base_cost_price,
    p.reorder_point,
    p.is_active,
    COALESCE(SUM(il.quantity), 0) AS current_stock,
    COALESCE(SUM(il.quantity), 0) * p.base_cost_price AS stock_value
  FROM products p
  LEFT JOIN inventory_logs il ON il.product_id = p.id
  WHERE p.salon_id = p_salon_id
    AND p.is_active = true
  GROUP BY p.id, p.name, p.category, p.base_sell_price, p.base_cost_price, p.reorder_point, p.is_active
  ORDER BY p.name;
$$;

-- ----------------------------------------
-- 5. record_product_sale() RPC
--    物販登録 + 自動出庫をアトミックに実行
-- ----------------------------------------
CREATE OR REPLACE FUNCTION record_product_sale(
  p_salon_id uuid,
  p_customer_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_sell_price integer,
  p_purchase_date date DEFAULT CURRENT_DATE,
  p_memo text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_product record;
  v_purchase_id uuid;
  v_total_price integer;
  v_remaining_stock bigint;
BEGIN
  -- 商品を取得
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id AND salon_id = p_salon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '商品が見つかりません';
  END IF;

  v_total_price := p_sell_price * p_quantity;

  -- 物販レコード作成
  INSERT INTO purchases (
    salon_id, customer_id, purchase_date, item_name,
    quantity, unit_price, total_price, memo,
    product_id, cost_price, sell_price
  ) VALUES (
    p_salon_id, p_customer_id, p_purchase_date, v_product.name,
    p_quantity, p_sell_price, v_total_price, p_memo,
    p_product_id, v_product.base_cost_price, p_sell_price
  )
  RETURNING id INTO v_purchase_id;

  -- 在庫出庫ログ作成（負数）
  INSERT INTO inventory_logs (
    salon_id, product_id, log_type, quantity,
    unit_cost_price, unit_sell_price,
    related_purchase_id, logged_at
  ) VALUES (
    p_salon_id, p_product_id, 'sale_out', -p_quantity,
    v_product.base_cost_price, p_sell_price,
    v_purchase_id, p_purchase_date
  );

  -- 残り在庫を計算
  SELECT COALESCE(SUM(quantity), 0) INTO v_remaining_stock
  FROM inventory_logs
  WHERE product_id = p_product_id;

  RETURN jsonb_build_object(
    'purchase_id', v_purchase_id,
    'remaining_stock', v_remaining_stock
  );
END;
$$;

-- ----------------------------------------
-- 6. get_tax_report() RPC
--    確定申告用の年間集計データを取得
-- ----------------------------------------
CREATE OR REPLACE FUNCTION get_tax_report(
  p_salon_id uuid,
  p_year integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_year_start date;
  v_year_end date;
  v_prev_year_end date;
  v_opening_stock_value bigint;
  v_closing_stock_value bigint;
  v_total_purchases bigint;
  v_monthly_purchases jsonb;
  v_closing_details jsonb;
BEGIN
  v_year_start := make_date(p_year, 1, 1);
  v_year_end := make_date(p_year, 12, 31);
  v_prev_year_end := make_date(p_year - 1, 12, 31);

  -- 期首棚卸高（前年末までの在庫数 × 基本仕入価）
  SELECT COALESCE(SUM(sub.stock * sub.base_cost_price), 0)
  INTO v_opening_stock_value
  FROM (
    SELECT
      il.product_id,
      p.base_cost_price,
      SUM(il.quantity) AS stock
    FROM inventory_logs il
    JOIN products p ON p.id = il.product_id
    WHERE il.salon_id = p_salon_id
      AND il.logged_at <= v_prev_year_end
    GROUP BY il.product_id, p.base_cost_price
  ) sub
  WHERE sub.stock > 0;

  -- 期末棚卸高（当年末までの在庫数 × 基本仕入価）
  SELECT COALESCE(SUM(sub.stock * sub.base_cost_price), 0)
  INTO v_closing_stock_value
  FROM (
    SELECT
      il.product_id,
      p.base_cost_price,
      SUM(il.quantity) AS stock
    FROM inventory_logs il
    JOIN products p ON p.id = il.product_id
    WHERE il.salon_id = p_salon_id
      AND il.logged_at <= v_year_end
    GROUP BY il.product_id, p.base_cost_price
  ) sub
  WHERE sub.stock > 0;

  -- 当年仕入合計
  SELECT COALESCE(SUM(quantity * COALESCE(unit_cost_price, 0)), 0)
  INTO v_total_purchases
  FROM inventory_logs
  WHERE salon_id = p_salon_id
    AND log_type = 'purchase_in'
    AND logged_at BETWEEN v_year_start AND v_year_end;

  -- 月別仕入金額
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_monthly_purchases
  FROM (
    SELECT
      EXTRACT(MONTH FROM logged_at)::integer AS month,
      SUM(quantity * COALESCE(unit_cost_price, 0)) AS amount
    FROM inventory_logs
    WHERE salon_id = p_salon_id
      AND log_type = 'purchase_in'
      AND logged_at BETWEEN v_year_start AND v_year_end
    GROUP BY EXTRACT(MONTH FROM logged_at)
    ORDER BY month
  ) sub;

  -- 期末棚卸明細
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::jsonb)
  INTO v_closing_details
  FROM (
    SELECT
      p.name AS product_name,
      SUM(il.quantity) AS stock,
      p.base_cost_price AS unit_price,
      SUM(il.quantity) * p.base_cost_price AS total_value
    FROM inventory_logs il
    JOIN products p ON p.id = il.product_id
    WHERE il.salon_id = p_salon_id
      AND il.logged_at <= v_year_end
    GROUP BY p.id, p.name, p.base_cost_price
    HAVING SUM(il.quantity) > 0
    ORDER BY p.name
  ) sub;

  RETURN jsonb_build_object(
    'year', p_year,
    'opening_stock_value', v_opening_stock_value,
    'closing_stock_value', v_closing_stock_value,
    'total_purchases', v_total_purchases,
    'cost_of_goods_sold', v_opening_stock_value + v_total_purchases - v_closing_stock_value,
    'monthly_purchases', v_monthly_purchases,
    'closing_stock_details', v_closing_details
  );
END;
$$;
