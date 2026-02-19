-- ========================================
-- 顧客卒業機能
-- customers.graduated_at カラム追加
-- 本番適用済み: 20260219074808_customer_graduation
-- ========================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS graduated_at TIMESTAMPTZ;
