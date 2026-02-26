-- 未インデックスの外部キーにインデックスを追加
-- Supabase performance advisor で検出された7件

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_menu_id
  ON appointments (menu_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_treatment_record_id
  ON appointments (treatment_record_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_counseling_sheets_salon_id
  ON counseling_sheets (salon_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_logs_related_purchase_id
  ON inventory_logs (related_purchase_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_line_message_logs_customer_line_link_id
  ON line_message_logs (customer_line_link_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_product_id
  ON purchases (product_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_treatment_records_menu_id
  ON treatment_records (menu_id);
