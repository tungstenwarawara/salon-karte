# salon-karte — Claude開発ガイド

## プロジェクト概要
個人サロンオーナー向けの電子カルテPWA。Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + Supabase。

## 開発ルール

### ブランチ戦略
- `main`: 本番ブランチ（Vercelが自動デプロイ → salon-karte.vercel.app）
- 機能開発は `claude/` プレフィックスのワークツリーで作業 → PR → main にマージ

### コーディング規約
- 日本語UI（ラベル・プレースホルダー・エラーメッセージ・コメント全て日本語）
- Tailwind CSS 4 のカスタムカラー使用: `bg-accent`, `text-text-light`, `border-border` 等
- コンポーネントは `src/components/` に配置、ページは `src/app/(dashboard)/` 配下
- Supabaseクライアントは `createClient()` をページ内で直接使用（Server Componentではserver版）
- 型定義は `src/types/database.ts` に集約

---

## 🔴 マージ・デプロイ前 必須チェックリスト

**以下を全てパスしないとマージ・デプロイしてはいけない。**

### 1. ビルド検証
```bash
npx next build
```
- [ ] ビルドエラーゼロ
- [ ] ESLint警告を確認（重大なものがないか）

### 2. DB整合性チェック（Supabase MCP）
```
list_tables → ローカルのマイグレーションファイルと一致するか
list_migrations → ローカルのファイル数と一致するか
```
- [ ] ローカルのマイグレーションファイル数 = 本番DBのマイグレーション数
- [ ] 新規テーブル/カラム追加時: 本番DBに適用済みか確認
- [ ] `src/types/database.ts` の型がマイグレーションと完全一致

### 3. RPC関数チェック
- [ ] `database.ts` の `Functions` セクションに定義された全RPC関数がマイグレーションSQLに存在
- [ ] 全RPC関数に `SECURITY INVOKER` + `SET search_path = public` が設定済み
- [ ] コード内の `.rpc()` 呼び出しが型定義と一致

### 4. ルート整合性
- [ ] `dashboard-header.tsx` のナビリンクが全て実在するページを指している
- [ ] FABアクションのリンクが全て実在するページを指している
- [ ] 全ページの `redirect()` / `Link href` が実在ルートを指している

### 5. セキュリティ
```
get_advisors(type: "security") → 新規WARN/ERRORがないか
```
- [ ] Supabase security linterに新規警告なし
- [ ] RLSが全テーブルで有効
- [ ] 環境変数がハードコードされていない

### 6. パフォーマンス
- [ ] ダッシュボードのクエリ数が増えていないか（現在: 9 + 条件付き2）
- [ ] `head: true` / `count: 'exact'` を適切に使用
- [ ] 不必要な `select('*')` がないか

---

## 🟡 コード変更時のチェック項目

### ページ新規作成時
- [ ] `loading.tsx` スケルトンを追加
- [ ] パンくずを `<PageHeader>` に設定
- [ ] エラーハンドリング（`ErrorAlert` コンポーネント使用）
- [ ] 空状態のUI（データゼロ時の案内表示）

### DB変更時
- [ ] マイグレーションファイルをローカルに作成
- [ ] `database.ts` の型を更新（Row/Insert/Update + Functions + Relationships）
- [ ] 本番DBにマイグレーション適用
- [ ] `list_tables` / `list_migrations` で同期確認

### コンポーネント変更時
- [ ] 影響範囲の確認（そのコンポーネントを使用している全ページ）
- [ ] レスポンシブ確認（最小幅320px想定）
- [ ] タッチターゲット48px以上

---

## 📋 全画面テスト仕様

### 認証フロー
| テスト | 期待結果 |
|--------|----------|
| 新規登録 → サロン作成 | /setup → /dashboard に遷移 |
| ログイン | /dashboard に遷移 |
| 未認証で /dashboard アクセス | /login にリダイレクト |
| パスワードリセット | メール送信 → 更新画面表示 |

### ダッシュボード (`/dashboard`)
| テスト | 期待結果 |
|--------|----------|
| 本日の予約表示 | 今日の予約がカードで表示 |
| 最近の施術表示 | 直近5件表示 |
| 離脱顧客セクション | 60日以上未来店の顧客を表示 |
| 卒業ボタン | graduated_at が更新され一覧から消える |
| 在庫アラート（商品登録時のみ） | 発注点以下の商品を警告表示 |

### 顧客管理 (`/customers`)
| テスト | 期待結果 |
|--------|----------|
| 顧客一覧表示 | 全顧客がカードで表示 |
| 検索 | 名前・カナ・電話番号でフィルタ |
| 新規登録 | 必須: 姓・名、保存後一覧に反映 |
| 詳細表示 | 基本情報 + 施術履歴 + 物販 + 回数券 |
| 編集 | 全フィールド更新可能 |

### 施術カルテ (`/records`)
| テスト | 期待結果 |
|--------|----------|
| 新規作成 | 顧客選択 → メニュー → 記録入力 → 保存 |
| 写真アップロード | before/after写真をアップロード・表示 |
| 詳細表示 | 全フィールド + 写真比較表示 |
| 編集 | 全フィールド更新可能 |

### 予約管理 (`/appointments`)
| テスト | 期待結果 |
|--------|----------|
| 日別表示 | タイムライン形式で予約表示 |
| 新規予約 | 顧客 + メニュー（複数） + 日時 + 経路 |
| 予約編集 | ステータス変更（scheduled/completed/cancelled） |
| 施術記録連携 | completed時にカルテ作成リンク表示 |

### 売上・経営 (`/sales`)
| テスト | 期待結果 |
|--------|----------|
| 月別売上グラフ | 施術/物販/回数券の3カテゴリ表示 |
| 年切替 | 過去年の売上を表示 |
| ドリルダウン | 月タップで詳細（日別売上）表示 |

### 在庫管理 (`/sales/inventory`)
| テスト | 期待結果 |
|--------|----------|
| 商品マスタCRUD | 追加/編集/非表示切替/削除 |
| 在庫ダッシュボード | サマリーカード + 商品リスト表示 |
| 仕入記録 | 商品選択 → 数量 → 仕入価 → 保存 → 在庫増加 |
| 消費・廃棄 | 種別選択 → 数量 → 保存 → 在庫減少 |
| 物販（商品モード） | 商品選択 → 自動売価 → 保存 → 在庫自動減算 |
| 物販（自由入力モード） | 従来通り手動入力 → 在庫連動なし |
| 棚卸し | 実在庫入力 → 差分計算 → adjustログ生成 |
| 確定申告レポート | 期首/仕入/期末/原価/粗利の計算表示 |
| CSV出力 | freee/弥生/汎用の3形式でダウンロード |

### 設定 (`/settings`)
| テスト | 期待結果 |
|--------|----------|
| サロン情報編集 | 名前・電話・住所の更新 |
| 営業時間設定 | 曜日別のON/OFF + 時間設定 |
| メニュー管理 | CRUD + カテゴリ + 価格 + 表示/非表示 |

---

## 🗂 ファイル構成

```
src/
├── app/
│   ├── (auth)/           # 認証ページ（login, signup, reset等）
│   ├── (dashboard)/      # 認証必須ページ（layout.tsxでヘッダー表示）
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── appointments/
│   │   ├── records/
│   │   ├── sales/
│   │   │   └── inventory/ # 在庫管理サブルート
│   │   └── settings/
│   └── auth/callback/     # OAuth/マジックリンクコールバック
├── components/
│   ├── layout/            # DashboardHeader, PageHeader
│   ├── ui/                # Toast, ErrorAlert, CollapsibleSection
│   ├── dashboard/         # LapsedCustomersSection
│   ├── customers/         # CourseTicketSection
│   ├── records/           # PhotoUpload, BeforeAfterComparison
│   └── inventory/         # ManagementTabs
├── lib/supabase/          # client.ts, server.ts, middleware.ts
└── types/database.ts      # Supabase型定義（唯一の真実）

supabase/migrations/       # 00001〜00015（全てローカルに管理）
```

## DB構成（11テーブル + 7 RPC関数）

| テーブル | 用途 |
|---------|------|
| salons | サロン情報（1ユーザー1サロン） |
| customers | 顧客マスタ |
| treatment_menus | 施術メニューマスタ |
| treatment_records | 施術カルテ |
| treatment_photos | 施術写真（Supabase Storage連携） |
| appointments | 予約 |
| appointment_menus | 予約-メニュー中間テーブル |
| purchases | 物販記録 |
| course_tickets | 回数券 |
| products | 商品マスタ（在庫管理） |
| inventory_logs | 入出庫ログ |

| RPC関数 | 用途 |
|---------|------|
| get_lapsed_customers | 離脱顧客取得 |
| use_course_ticket_session | 回数券消化（アトミック） |
| get_monthly_sales_summary | 月別売上集計 |
| get_inventory_summary | 在庫サマリー |
| record_product_sale | 物販+出庫のアトミック処理 |
| get_tax_report | 確定申告レポート |
| update_updated_at | トリガー用タイムスタンプ更新 |

## ⚠️ 既知の問題（Phase 6で対応予定）

### 売上レポートの二重計上
- `get_monthly_sales_summary` の treatment_sales に回数券支払い分の施術も含まれている
- 回数券購入額（ticket_sales）と施術売上（treatment_sales）が重複し、合計が実収入より大きくなる
- **原因**: `appointment_menus` に支払方法（現金/回数券）の区分がない
- **影響範囲**: `/sales`（売上レポート）、`/sales/inventory/tax-report`（確定申告レポート）
- **Phase 6で対応**: appointment_menusにpayment_type追加、RPC修正

## 教訓ログ（品質管理失敗ログ）

### 2026-02-19: 商品追加エラー
**原因**: `00012_inventory_management.sql` が本番DBに未適用のままデプロイされていた
**根本原因**: ワークツリーでのマイグレーション作成 → PRマージ → デプロイの流れで、本番DBへのマイグレーション適用ステップが抜けていた
**対策**: マージ前チェックリストに「本番DBマイグレーション適用確認」を必須項目として追加

### 2026-02-19: マイグレーション管理の不一致
**原因**: 一部マイグレーション（graduated_at, monthly_sales_summary）がSupabase dashboardから直接適用され、ローカルにファイルが存在しなかった
**対策**: 全マイグレーションは必ずローカルファイルとして管理。dashboard直接適用時はローカルにも同内容のファイルを作成

### 2026-02-19: セキュリティ警告
**原因**: RPC関数にSET search_path未設定
**対策**: 新規関数作成時は必ず `SECURITY INVOKER` + `SET search_path = public` を設定
