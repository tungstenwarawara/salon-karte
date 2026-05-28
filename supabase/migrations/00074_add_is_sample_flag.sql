-- オンボーディング時のオプトインサンプルデータ識別用フラグ
-- customers / treatment_menus にのみ付与
-- 関連レコード（treatment_records / appointments / purchases / course_tickets / treatment_record_menus）は
-- customer_id ON DELETE CASCADE / menu_id ON DELETE SET NULL の挙動で連鎖削除/解除される

ALTER TABLE customers
  ADD COLUMN is_sample BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE treatment_menus
  ADD COLUMN is_sample BOOLEAN NOT NULL DEFAULT FALSE;

-- サンプル削除を高速化するための部分インデックス
CREATE INDEX idx_customers_is_sample
  ON customers(salon_id) WHERE is_sample = TRUE;

CREATE INDEX idx_treatment_menus_is_sample
  ON treatment_menus(salon_id) WHERE is_sample = TRUE;

COMMENT ON COLUMN customers.is_sample IS 'setup時にオプトインで投入されたサンプル顧客であることを示すフラグ';
COMMENT ON COLUMN treatment_menus.is_sample IS 'setup時にオプトインで投入されたサンプルメニューであることを示すフラグ';
