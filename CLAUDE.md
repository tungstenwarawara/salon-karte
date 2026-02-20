# salon-karte — Claude開発ガイド

## プロジェクト概要
個人サロンオーナー向けの電子カルテPWA。Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + Supabase。
**ターゲットユーザー**: ITリテラシーが高くない個人サロンオーナー（1人運営）。スマホメイン。

## 🎯 開発哲学（全ての判断基準）

### 1. シンプルさ最優先
- **1画面1目的**: 1つのページに複数の主要タスクを詰め込まない
- **3クリック以内**: 主要操作は3タップ以内で完了できること
- **迷わないUI**: 選択肢は最小限。「どうすればいいか分からない」状態を作らない
- **機能追加の前に問う**: 「これがないと業務が回らないか？」→ NOなら追加しない

### 2. 高品質・ゼロバグ
- **型安全**: `any` 禁止。`as` キャスト最小限。`database.ts` が唯一の真実
- **null安全**: `?.` と `?? デフォルト値` を徹底。undefinedをUIに露出させない
- **アトミック操作**: 複数テーブル更新は必ずRPC関数（トランザクション）を使用
- **エラー表示**: 全操作にエラーハンドリング。ユーザーに「何が起きたか」「何をすべきか」を伝える

### 3. パフォーマンス
- **ダッシュボード1秒以内**: 全クエリ並列実行（Promise.all）。体感速度を最優先
- **カウントのみの場合**: `head: true` + `count: 'exact'` でデータ転送ゼロ
- **必要なカラムだけ**: `select('*')` 禁止。使うカラムだけを明示的に指定
- **集計はDBで**: 大量データの集計はRPC関数内のSQLで実行。JSでのreduce/filterは小規模データのみ

---

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

### ファイルサイズ制限（厳守）
- **ページファイル**: 最大300行。超えたらコンポーネント分割必須
- **コンポーネント**: 最大200行。超えたら責務分割
- **現在の違反** (要リファクタリング — 2026-02-20時点):
  - `sales/page.tsx` (491行) → グラフ・ドリルダウンをコンポーネント化
  - `appointments/new/page.tsx` (434行) → メニュー選択をコンポーネント化
  - `appointments/[id]/edit/page.tsx` (424行) → 同上
  - `records/new/page.tsx` (409行) → フォームセクションをさらに分割
  - `records/[id]/edit/page.tsx` (406行) → 同上
- **基準内に改善済み**:
  - `dashboard/page.tsx` (228行) ← セクションコンポーネント化完了

### Supabaseクエリルール（マルチテナント安全）
- **全クエリに `.eq("salon_id", salon.id)` 必須** — RLSが最終防衛線だが、コード側でも必ずフィルタ
- **INSERT時**: salon_id を必ず含める
- **関連テーブル**: 親テーブル経由でsalon_idフィルタが効いているか確認
- **RPC関数**: 引数に `p_salon_id` を渡し、関数内でも検証

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
- [ ] 全Supabaseクエリにsalon_idフィルタが存在

### 6. パフォーマンス
- [ ] ダッシュボードのクエリ数が増えていないか（現在: 10 + 条件付き1）
- [ ] `head: true` / `count: 'exact'` を適切に使用
- [ ] 不必要な `select('*')` がないか
- [ ] 新規ページのクエリは `Promise.all` で並列化されているか

### 7. UIUX品質
- [ ] 新規画面はスマホ幅(375px)で表示崩れなし
- [ ] 全ボタン・リンクのタッチターゲット48px以上
- [ ] フォーム送信中は二重送信防止（disabled + ローディング表示）
- [ ] 成功/エラー時のフィードバックがある（Toast or ErrorAlert）
- [ ] ファイルサイズ制限を遵守（ページ300行、コンポーネント200行）

---

## 🟡 コード変更時のチェック項目

### ページ新規作成時
- [ ] `loading.tsx` スケルトンを追加
- [ ] パンくずを `<PageHeader>` に設定
- [ ] エラーハンドリング（`ErrorAlert` コンポーネント使用）
- [ ] 空状態のUI（データゼロ時の案内表示 + 作成ボタン）
- [ ] 二重送信防止（フォームがある場合）
- [ ] `router.push()` 後の成功Toast

### DB変更時
- [ ] マイグレーションファイルをローカルに作成
- [ ] `database.ts` の型を更新（Row/Insert/Update + Functions + Relationships）
- [ ] 本番DBにマイグレーション適用（Supabase MCPで `apply_migration`）
- [ ] `list_tables` / `list_migrations` で同期確認
- [ ] RLSポリシーが新テーブルに設定済み

### コンポーネント変更時
- [ ] 影響範囲の確認（そのコンポーネントを使用している全ページ）
- [ ] レスポンシブ確認（最小幅320px想定）
- [ ] タッチターゲット48px以上

### 機能追加時の問いかけ
- [ ] 「この機能がないと業務が回らないか？」
- [ ] 「既存画面に追加するより新画面が適切か？」
- [ ] 「ユーザーは説明なしで使い方がわかるか？」

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
| 最近の施術表示 | 直近3件表示 |
| 離脱顧客セクション | 60日以上未来店の顧客を表示 |
| 卒業ボタン | graduated_at が更新され一覧から消える |
| 在庫アラート（商品登録時のみ） | 発注点以下の商品を警告表示 |
| 今月の売上サマリー | 施術/物販/回数券の合計表示 |
| 今月の誕生日 | 該当顧客を表示 |

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
| 回数券消化 | チケット選択 → used_sessions +1 |
| 物販・回数券購入記録 | カルテに紐づけて保存 |

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
| 不定休設定 | カレンダー形式で臨時休業日を設定・削除 |
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

supabase/migrations/       # 00001〜00021（全てローカルに管理）
```

## DB構成（12テーブル + 10 RPC関数）

| テーブル | 用途 |
|---------|------|
| salons | サロン情報（1ユーザー1サロン、business_hours + salon_holidays JSONB） |
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

| RPC関数 | 用途 |
|---------|------|
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

---

## 🛡 セキュリティ必須事項

### マルチテナント分離
- 全テーブルにRLS有効
- 全RLSポリシー: `auth.uid() = (SELECT user_id FROM salons WHERE id = table.salon_id)`
- コード側でも `.eq("salon_id", salon.id)` を必ず付与（RLSのフォールバック）
- RPC関数は `SECURITY INVOKER` + `SET search_path = public`

### 入力バリデーション
- 数値フィールド: `parseInt`/`parseFloat` → `isNaN` チェック
- 日付フィールド: 不正な日付はフォーム側でブロック
- 文字列: Supabase SDKがパラメータ化クエリを使用（SQL injection防止）
- ファイルアップロード: MIME type + サイズ制限（5MB）

### 認証フロー
- `middleware.ts`: `/dashboard` 以下は認証必須
- 各ページの `getAuthAndSalon()`: ユーザー → サロン紐づけ確認
- サロン未作成: `/setup` にリダイレクト

---

## ⚡ パフォーマンスガイドライン

### ダッシュボード（最重要ページ）
- 現在: 10クエリ並列 + 条件付き1クエリ = 最大11クエリ
- 全クエリを `Promise.all` で並列実行
- カウントのみのクエリ: `head: true, count: 'exact'`
- 月次売上集計: 現在JSで集計中 → `get_monthly_sales_summary` RPC使用を推奨

### 一般ページ
- Server Component でデータ取得（Client Component はインタラクションのみ）
- `loading.tsx` で即座にスケルトン表示
- 画像: Supabase Storage の signed URL（1時間有効）
- フォーム下書き: `useFormDraft` hook で localStorage 保存

### クエリ最適化チェック
```
良い例: .select("id, name, price").eq("salon_id", salon.id)
悪い例: .select("*")  ← 使わないカラムも取得してしまう
良い例: .select("id", { count: "exact", head: true })  ← カウントだけ
悪い例: .select("*").then(d => d.length)  ← 全データ取得してからカウント
```

---

## 🔵 現状整理・設計判断・次の計画（2026-02-20更新）

### 確認済みの設計判断（変更しないこと）

1. **決済方法は4種のみ**: `cash`/`credit`/`ticket`/`service`
   - URL決済・振込・電子マネー等は **対象外**（個人サロンの実業務に不要）
   - 将来追加しない。シンプルさ最優先の原則に基づく

2. **施術・物販・回数券は1画面内（カルテ新規作成）**:
   - `records/new/page.tsx` に物販・回数券販売が `CollapsibleSection` で同居
   - 「非表示→クリックで展開」方式で実装済み。別画面にしない
   - 回数券消化はメニュー選択時に `paymentType: "ticket"` で紐づけ

3. **回数券の独立管理画面は不要**:
   - 回数券販売 → カルテ作成時にインラインで
   - 回数券消化 → カルテのメニュー支払タイプで連動
   - 回数券一覧・残回数確認 → 顧客詳細ページ内の `CourseTicketSection`
   - 消化回数の手動調整 → 顧客詳細ページ内で対応済み

### 現在の品質ギャップ（要対応）

| # | ギャップ | 現状 | 基準 | 優先度 |
|---|---------|------|------|--------|
| G1 | `sales/page.tsx` 肥大化 | 491行 | 300行以下 | 中 |
| G2 | `appointments/new/page.tsx` 肥大化 | 434行 | 300行以下 | 中 |
| G3 | `appointments/[id]/edit/page.tsx` 肥大化 | 424行 | 300行以下 | 中 |
| G4 | `records/new/page.tsx` 肥大化 | 409行 | 300行以下 | 中 |
| G5 | `records/[id]/edit/page.tsx` 肥大化 | 406行 | 300行以下 | 中 |

### 次のタスク計画（別セッションで着手可能）

**方針**: 新機能追加より先に、既存コードの品質ギャップを解消する。
ファイル分割は「動作を変えずにコンポーネント抽出」のみ。UIや機能は変更しない。

#### Phase A: ファイル分割リファクタリング（機能変更なし）
| タスク | 対象 | 分割方針 |
|--------|------|----------|
| A1 | `sales/page.tsx` (491行) | グラフ描画 → `SalesChart`、ドリルダウン → `MonthlyDrilldown`、在庫タブリンク部分を分離 |
| A2 | `appointments/new/page.tsx` (434行) | メニュー選択UI → `AppointmentMenuSelector` を抽出 |
| A3 | `appointments/[id]/edit/page.tsx` (424行) | A2と同じコンポーネントを共用 |
| A4 | `records/new/page.tsx` (409行) | 施術記録フィールド群 → `RecordFormFields` を抽出 |
| A5 | `records/[id]/edit/page.tsx` (406行) | A4と同じコンポーネントを共用 |

**着手順序**: A1 → A2/A3（ペア） → A4/A5（ペア）
**完了条件**: 全ページが300行以下、ビルドエラーゼロ、動作変更なし

#### Phase B: 今後の機能追加候補（優先度順・オーナー承認後のみ着手）
- （現時点で追加予定の機能なし — 業務に必要な機能は一通り実装済み）
- 機能追加はオーナーからの具体的な要望があった場合のみ検討

---

## ✅ 解決済みの問題

### 売上レポートの二重計上 → Phase 6-3で修正済み
- `treatment_record_menus` に `payment_type` カラムを追加（cash/credit/ticket/service）
- `get_monthly_sales_summary` を修正: 施術売上はcash/creditのみ集計
- `/sales` ページのドリルダウンも同様にフィルタ済み

---

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

### 2026-02-20: ファイル肥大化
**原因**: records/new/page.tsx が1145行に膨張。フォーム・メニュー選択・回数券・物販・写真が1ファイルに
**根本原因**: 機能追加のたびに既存ファイルに追記し続けた。コンポーネント分割の基準がなかった
**対策**: ファイルサイズ制限を導入（ページ300行、コンポーネント200行）。超過時は分割必須

### 2026-02-20: 不要機能の計画混入
**原因**: 実業務に存在しないURL決済・振込などの決済方法を計画に含めかけた
**根本原因**: ユーザーの実業務フローを確認せず、一般論で機能を列挙した
**対策**: 「設計判断」セクションをCLAUDE.mdに明記。機能追加前に必ず「これがないと業務が回らないか？」を問う。既存コードの実態を確認してから計画を立てる
