---
globs:
  - "src/types/database.ts"
  - "supabase/migrations/**/*.sql"
---

# データベース・マイグレーションルール

## スキーマ概要（12テーブル）

| テーブル | 用途 |
|---------|------|
| salons | サロン情報（business_hours + salon_holidays JSONB） |
| customers | 顧客マスタ |
| treatment_menus | 施術メニューマスタ |
| treatment_records | 施術カルテ |
| treatment_record_menus | カルテ-メニュー中間テーブル（payment_type, ticket_id付き） |
| treatment_photos | 施術写真（Supabase Storage連携） |
| appointments | 予約 |
| appointment_menus | 予約-メニュー中間テーブル |
| purchases | 物販記録（product_id, treatment_record_id付き） |
| course_tickets | 回数券（treatment_record_id付き） |
| products | 商品マスタ（在庫管理） |
| inventory_logs | 入出庫ログ |

## RPC関数（10関数）

| 関数 | 用途 |
|------|------|
| get_lapsed_customers | 離脱顧客取得 |
| use_course_ticket_session | 回数券消化（アトミック） |
| undo_course_ticket_session | 回数券消化取消 |
| adjust_course_ticket_sessions | 回数券消化回数の手動調整 |
| get_monthly_sales_summary | 月別売上集計（cash/creditのみ） |
| get_inventory_summary | 在庫サマリー |
| record_product_sale | 物販+出庫のアトミック処理 |
| reverse_product_sale | 物販取消+在庫戻し |
| get_tax_report | 確定申告レポート |
| update_updated_at | トリガー用タイムスタンプ更新 |

## マイグレーション管理
- `supabase/migrations/` に00001〜00021のファイル
- Supabase dashboardからの直接適用禁止（必ずローカルファイルを作成）
- ファイル命名: `00XXX_descriptive_snake_case.sql`

## DB変更チェックリスト
- マイグレーションファイルをローカルに作成
- `database.ts` の型を更新（Row/Insert/Update + Functions + Relationships）
- 本番DBにマイグレーション適用（Supabase MCPで `apply_migration`）
- `list_tables` / `list_migrations` で同期確認
- RLSポリシーが新テーブルに設定済み
- RPC関数に `SECURITY INVOKER` + `SET search_path = public`

## 型安全
- `database.ts` が唯一の真実
- `any` 型禁止
- `as` キャスト最小限
- `.rpc()` 呼び出しは Functions 型定義と一致必須
