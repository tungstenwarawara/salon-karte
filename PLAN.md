# サロンカルテ - エステサロン向けカルテ＆予約管理システム

## プロジェクト概要

個人エステサロン向けの「カルテ管理 + 予約管理 + 来店分析」のWebアプリ。
既存サービス（月額5,500〜21,000円）が抱える「多機能すぎて高い」問題を解決し、
本当に必要な機能だけを月額2,980円で提供する。
使いたい機能を追加するたびに課金していくモジュール型サブスクモデル。

## ターゲットユーザー

- 個人経営のエステサロンオーナー（1人〜少人数運営）
- 現在、紙カルテやExcelで顧客管理している
- ITリテラシーは高くない（スマホは使えるがPCは苦手な層）
- 予約管理はホットペッパーや電話・LINEなど複数チャネルで受けている

## 競合との差別化

| 項目 | 既存サービス（Bionly, BeSALO等） | サロンカルテ |
|------|-------------------------------|-------------|
| 月額料金 | 5,500〜21,000円 | 2,980円〜 |
| 初期費用 | 0〜30,000円 | 0円 |
| 機能範囲 | カルテ+予約+POS+分析+メール配信 | カルテ+予約+来店分析（必要な分だけ） |
| 対象規模 | 小〜中規模（多店舗対応あり） | 個人・少人数サロン |
| 操作難易度 | 覚えることが多い | スマホ感覚で即使える |
| 契約縛り | 6ヶ月〜が多い | 1ヶ月単位 |
| 料金体系 | 全機能パック | 使う機能だけ選んで払う |

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- **バックエンド/DB**: Supabase (PostgreSQL + Auth + Storage)
- **ホスティング**: Vercel
- **認証**: Supabase Auth（メール/パスワード）
- **画像保存**: Supabase Storage（施術前後の写真）
- **デプロイ**: GitHub → Vercel自動デプロイ

### 技術選定の理由

- Next.js: SSR/SSGでSEO対応可能、Vercelとの親和性が高い
- Supabase: RLS（Row Level Security）で個人情報保護が容易、無料枠が大きい
- Tailwind CSS: レスポンシブ対応が容易、スマホファースト設計に最適
- Vercel: 無料枠でスタート可能、GitHub連携でCI/CD自動化

## 機能一覧

### 基本プラン（2,980円/月）に含まれる機能

#### 1. 認証 ✅ 実装済み
- サロンオーナーのアカウント登録（メール/パスワード）
- ログイン/ログアウト
- パスワードリセット

#### 2. 顧客管理 ✅ 実装済み → 🔄 項目追加予定
- 顧客の新規登録
  - 氏名（カナ）
  - 生年月日
  - 電話番号
  - メールアドレス（任意）
  - 肌質（ドロップダウン: 普通肌/乾燥肌/脂性肌/混合肌/敏感肌）
  - アレルギー・注意事項（フリーテキスト）
  - メモ（フリーテキスト）
  - 🆕 住所（郵送物対応のため）
  - 🆕 年齢自動表示（生年月日から自動計算）
  - 🆕 婚姻状況（未婚/既婚）
  - 🆕 お子様（あり/なし）
  - 🆕 DM送付可否
  - 🆕 身体情報（身長・体重等 ※痩身/バスト系サロン向け）
  - 🆕 施術の最終目標（フリーテキスト）
- 顧客一覧表示（名前検索・カナ検索対応）
- 顧客情報の編集・削除
- 顧客詳細画面（基本情報+施術履歴一覧）

#### 3. 施術記録（カルテ） ✅ 実装済み → 🔄 項目追加・汎用化予定
テスターFBにより、エステ以外のサロン（リラク・痩身・バスト・ネイル等）にも対応するため
項目名を汎用化し、新規項目を追加する。

- 施術記録の新規作成
  - 施術日（デフォルト: 今日）
  - 施術メニュー（自由入力 or 事前登録メニューから選択）
  - 施術部位
  - 使用した化粧品・機器（フリーテキスト）
  - 施術前の状態メモ（旧: 肌の状態メモ → 汎用化）
  - 施術後の経過メモ
  - 次回への申し送り
  - 🆕 話した内容（会話メモ）
  - 🆕 注意事項
- 施術記録一覧（顧客ごとに時系列表示）
- 施術記録の編集・削除

#### 4. 写真管理 ✅ 実装済み
- 施術前後の写真アップロード（スマホカメラ直接 or ギャラリーから選択）
- 写真への簡易メモ付与
- ビフォーアフター比較表示（2枚を横並び）
- 保存容量: 5GB

#### 5. 施術メニューマスタ ✅ 実装済み
- サロンで提供する施術メニューの事前登録
  - メニュー名
  - カテゴリ（フェイシャル/ボディ/脱毛/その他）
  - 所要時間（目安）
  - 料金（目安）
- カルテ作成時にメニューマスタから選択可能

#### 6. 簡易予約管理 ✅ 実装済み → 🔄 機能強化予定
ホットペッパー・電話・LINE等すべてのチャネルからの予約を一元管理する。
ホットペッパーのサロンボードAPIは非公開（パートナー企業限定）のため、
自動連携ではなく手動登録での一元管理とする。

- 予約の新規登録（日時・顧客・メニュー・メモ）
- 今日の予約一覧（ダッシュボードに表示）
- 日別・週別のカレンダー表示
- 予約から顧客カルテにワンタップで遷移
- 予約から「施術記録を作成」にワンタップで遷移
- 予約のステータス管理（予定・来店済み・キャンセル）
- 🆕 メニュー複数選択（1予約に複数メニュー）

想定フロー:
```
朝: ダッシュボードを開く → 今日の予約一覧を確認
  ↓
お客様来店前: 予約をタップ → 顧客カルテで前回の施術内容を確認
  ↓
施術後: 予約から「施術記録を作成」→ カルテ記入 → 次回予約を登録
```

ホットペッパーとの棲み分け:
| | ホットペッパー | サロンカルテ |
|--|--------------|------------|
| 役割 | 新規集客・ネット予約受付 | 予約の一元管理・カルテ連動 |
| 予約の入り方 | お客様がネットで予約 | オーナーが手動登録（HP・電話・LINE含む） |
| カルテ連動 | なし | あり |

#### 7. 来店分析（基本版） ✅ 実装済み
スプレッドシートとの最大の差別化ポイント。

- 顧客ごとの最終来店日・来店回数の表示
- 顧客一覧での来店情報ソート
- しばらく来店していない顧客のハイライト（離脱アラート）
  - 60日以上来店なし → 「ご無沙汰のお客様」としてダッシュボードに表示
- ダッシュボードに来店分析サマリーを表示
- 卒業機能（離脱顧客のステータス管理）

#### 8. 売上レポート ✅ 実装済み
- 年間/月別売上推移グラフ（施術/物販/回数券の内訳表示）
- カテゴリフィルタ（施術/物販/回数券の切替）
- 月→日の日別ドリルダウン
- 前月比の変化率表示

#### 9. 在庫管理 ✅ 実装済み
- 商品マスタCRUD（商品名/カテゴリ/売価/仕入価/発注点/メモ）
- 在庫ダッシュボード（商品数/要発注数/在庫評価額/商品別在庫一覧）
- 入出庫記録（仕入/消費・サンプル/廃棄/返品/棚卸し調整）
- 物販連動（商品選択時に在庫を自動減算、RPCでアトミック処理）
- 棚卸し（全商品の実在庫を入力→差分を自動調整）
- ダッシュボードに在庫アラート（発注点以下の商品を通知）

#### 10. 確定申告サポート ✅ 実装済み
- 確定申告レポート（売上原価計算: 期首棚卸高+仕入高-期末棚卸高）
- 粗利サマリー（年間売上合計 - 売上原価）
- 月別売上・仕入の一覧表
- 期末棚卸明細（商品名/在庫数/仕入単価/金額）
- CSV出力3形式（汎用/freee/弥生）

### オプションモジュール（任意追加・Phase 2以降）

使いたい機能を追加するたびに課金していくモジュール型。
テスター運用後のフィードバックを受けて順次開発。

| モジュール | 月額（税込） | 内容 |
|-----------|-------------|------|
| カウンセリングシート | +500円 | 初回来店時にお客様自身がスマホで入力できるデジタル問診票 |
| カルテPDF出力 | +300円 | カルテを印刷用PDFで出力、お客様への施術報告書として |
| 写真拡張 | +500円 | 保存容量20GBに拡張、ビフォーアフター自動並べ替え |
| 来店分析（詳細版） | +500円 | リピート率・来店間隔トレンド・月別集計グラフ |
| LINE通知 | +1,000円 | 次回予約リマインド、施術後フォローメッセージ自動送信 |
| データエクスポート | +300円 | 顧客データ・施術記録のCSVエクスポート |
| 複数スタッフ対応 | +1,000円 | スタッフアカウント追加、権限管理 |

### 将来構想（Phase 3）

- サロン向けHP/LP自動生成（テスターサロンのHP手作り経験をもとにテンプレート化）

## データベース設計

### テーブル構成

```sql
-- サロン情報
CREATE TABLE salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 顧客情報
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name_kana TEXT,
  first_name_kana TEXT,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  skin_type TEXT, -- 普通肌/乾燥肌/脂性肌/混合肌/敏感肌
  allergies TEXT,
  notes TEXT,
  -- 🆕 Phase 1.5 テスターFBで追加
  address TEXT,                        -- 住所（郵送物対応）
  marital_status TEXT,                 -- 未婚/既婚
  has_children BOOLEAN,                -- お子様あり/なし
  dm_allowed BOOLEAN DEFAULT true,     -- DM送付可否
  height_cm NUMERIC,                   -- 身長（cm）
  weight_kg NUMERIC,                   -- 体重（kg）
  treatment_goal TEXT,                 -- 施術の最終目標（フリーテキスト）
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 施術メニューマスタ
CREATE TABLE treatment_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- フェイシャル/ボディ/脱毛/その他
  duration_minutes INTEGER,
  price INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 施術記録（カルテ）
CREATE TABLE treatment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  treatment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  menu_id UUID REFERENCES treatment_menus(id),
  menu_name_snapshot TEXT, -- メニュー名のスナップショット（メニュー削除時にも残る）
  treatment_area TEXT,
  products_used TEXT,
  skin_condition_before TEXT,  -- 🔄 ラベル汎用化: 「施術前の状態」
  notes_after TEXT,
  next_visit_memo TEXT,
  -- 🆕 Phase 1.5 テスターFBで追加
  conversation_notes TEXT,     -- 話した内容（会話メモ）
  caution_notes TEXT,          -- 注意事項
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 施術写真
CREATE TABLE treatment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_record_id UUID REFERENCES treatment_records(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  photo_type TEXT NOT NULL, -- 'before' / 'after'
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 予約管理
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES treatment_menus(id),
  menu_name_snapshot TEXT, -- メニュー名のスナップショット
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME, -- 任意（所要時間から自動計算も可）
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' / 'completed' / 'cancelled'
  source TEXT DEFAULT 'direct', -- 'hotpepper' / 'phone' / 'line' / 'direct' / 'other'
  memo TEXT,
  treatment_record_id UUID REFERENCES treatment_records(id), -- 施術後にカルテと紐付け
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- サブスクリプション管理
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free' / 'basic'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' / 'canceled' / 'past_due'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 有効なオプションモジュール
CREATE TABLE subscription_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);

-- 物販・購入記録（Phase 1.5で追加）
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  memo TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,  -- Phase 5で追加
  cost_price INTEGER,                                           -- Phase 5で追加
  sell_price INTEGER,                                           -- Phase 5で追加
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 回数券管理（Phase 1.5で追加）
CREATE TABLE course_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  ticket_name TEXT NOT NULL,
  total_count INTEGER NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  price INTEGER,
  purchase_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 予約メニュー中間テーブル（Phase 1.5で追加）
CREATE TABLE appointment_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  menu_name_snapshot TEXT NOT NULL,
  duration_snapshot INTEGER,
  price_snapshot INTEGER
);

-- 商品マスタ（Phase 5で追加）
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

-- 在庫ログ（Phase 5で追加）
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN (
    'purchase_in','sale_out','sample_out','waste_out','adjust','return_in'
  )),
  quantity INTEGER NOT NULL,  -- 正数=入庫、負数=出庫
  unit_cost_price INTEGER,
  unit_sell_price INTEGER,
  reason TEXT,
  related_purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RPC関数

| 関数名 | 用途 |
|--------|------|
| `get_monthly_sales_summary(p_salon_id, p_year)` | 月別売上集計（施術/物販/回数券） |
| `get_lapsed_customers(p_salon_id, p_days_threshold)` | 離脱顧客の検出 |
| `get_inventory_summary(p_salon_id)` | 全商品の在庫サマリー |
| `record_product_sale(...)` | 物販登録+自動出庫のアトミック処理 |
| `get_tax_report(p_salon_id, p_year)` | 確定申告用の年間集計データ |

### Row Level Security (RLS) 方針

全テーブルにRLSを有効化し、`salon_id`ベースでアクセス制御する。
オーナーは自分のサロンのデータのみ閲覧・編集可能。

```sql
-- 例: customersテーブルのRLSポリシー
CREATE POLICY "Salon owners can manage their customers"
  ON customers FOR ALL
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );
```

## 画面構成（30ページ）

```
── 認証 ──
/login                  → ログイン画面
/signup                 → アカウント登録画面
/reset-password         → パスワードリセット申請画面
/update-password        → 新パスワード設定画面
/setup                  → サロン初期設定

── 公開ページ ──
/                       → ランディングページ
/privacy                → プライバシーポリシー
/terms                  → 利用規約

── ダッシュボード ──
/dashboard              → ダッシュボード（予約一覧/離脱アラート/在庫アラート/誕生日/売上サマリー/最近のカルテ/オンボーディング）
/guide                  → 使い方ガイド

── 顧客管理 ──
/customers              → 顧客一覧（検索・来店情報付き）
/customers/new          → 顧客新規登録
/customers/[id]         → 顧客詳細（基本情報/施術履歴/購入履歴/回数券/来店分析）
/customers/[id]/edit    → 顧客情報編集
/customers/[id]/purchases/new → 物販記録登録（商品選択/自由入力デュアルモード）
/customers/[id]/tickets/new   → 回数券登録

── 施術記録 ──
/records/new            → 施術記録の新規作成（顧客選択UI付き）
/records/[id]           → 施術記録詳細（写真含む）
/records/[id]/edit      → 施術記録編集

── 予約管理 ──
/appointments           → 予約一覧（月別/週別/日別カレンダー）
/appointments/new       → 予約の新規登録（メニュー複数選択対応）
/appointments/[id]/edit → 予約編集

── 経営（売上+在庫） ──
/sales                  → 売上レポート（年間/月別推移グラフ、日別ドリルダウン、カテゴリフィルタ）
/sales/inventory        → 在庫ダッシュボード（サマリー/在庫一覧/クイックアクション）
/sales/inventory/products  → 商品マスタCRUD
/sales/inventory/receive   → 仕入記録（入庫）
/sales/inventory/consume   → 消費・廃棄記録（サンプル/廃棄/返品）
/sales/inventory/stocktake → 棚卸し
/sales/inventory/tax-report → 確定申告レポート（COGS計算/CSV出力）

── 設定 ──
/settings               → サロン設定
/settings/menus         → 施術メニュー管理
/settings/business-hours → 営業時間設定
```

## UI/UX方針

### 基本原則
- **モバイルファースト**: 施術の合間にスマホで操作することを前提に設計
- **タップ数最小化**: 主要操作は3タップ以内で完了
- **大きなタッチターゲット**: ボタンは最低44px以上
- **やさしい配色**: エステサロンの雰囲気に合うパステル系・ナチュラル系カラー

### カラーパレット（案）
- Primary: #8B7B6B（ウォームグレー/落ち着き）
- Accent: #C4956A（ゴールドベージュ/上品さ）
- Background: #FAF8F5（オフホワイト/温かみ）
- Text: #3D3D3D（ソフトブラック）
- Success: #7BAE7F（ナチュラルグリーン）
- Warning: #E8A87C（ソフトオレンジ）

### 主要操作フロー
1. **朝の確認**: ダッシュボード → 今日の予約一覧を確認（1ステップ）
2. **来店対応**: 予約タップ → 顧客カルテで前回確認 → 施術後にカルテ記入（3ステップ）
3. **カルテ作成**: ダッシュボード → 顧客選択 → 「施術記録を追加」→ 入力 → 保存（3ステップ）
4. **顧客検索**: 顧客一覧 → 検索バーにカナ入力 → タップで詳細表示（2ステップ）
5. **写真登録**: 施術記録作成中 → 「写真を追加」→ カメラ or ギャラリー → 保存（3ステップ）
6. **次回予約**: 施術記録保存後 → 次回予約を登録 → ダッシュボードに反映（2ステップ）

## セキュリティ要件

### 個人情報保護
- Supabase RLSによるデータアクセス制御（必須）
- HTTPS通信（Vercel標準）
- パスワードのハッシュ化（Supabase Auth標準）
- 写真ストレージはprivateバケットで管理（署名付きURL経由でのみアクセス）

### 運用面
- プライバシーポリシーの策定と掲載（必須）
- 利用規約の策定と掲載（必須）
- データ削除機能の実装（顧客からの削除要請対応）
- 個人情報取扱いに関する同意フローの実装

## 料金モデル: モジュール型サブスク

### コンセプト

「使いたい機能だけ選んで、必要な分だけ払う」

既存サービスの最大の不満は「使わない機能にお金を払わされる」こと。
サロンカルテでは基本料金で十分な価値を提供しつつ、追加機能をオプションモジュールとして
月額上乗せで提供する。サロンの成長に合わせて機能を足していけるので、
オーナーにとってもコスト管理がしやすく、解約理由が生まれにくい。

### 料金テーブル

#### 基本プラン（必須）

| プラン | 月額（税込） | 内容 |
|--------|-------------|------|
| お試し | 0円 | 顧客10件まで、写真なし、予約管理なし。導入判断用 |
| 基本プラン | 2,980円 | 顧客数無制限、施術記録、写真保存（5GB）、簡易予約管理、来店分析（基本版） |

基本プランの3本柱:
1. **カルテ管理** - 顧客情報・施術記録・写真管理
2. **簡易予約管理** - 全チャネルの予約を一元管理、カルテと連動
3. **来店分析（基本版）** - 最終来店日・来店回数・離脱アラート

#### オプションモジュール（任意追加）

| モジュール | 月額（税込） | 内容 |
|-----------|-------------|------|
| カウンセリングシート | +500円 | 初回来店時にお客様自身がスマホで入力できるデジタル問診票 |
| カルテPDF出力 | +300円 | カルテを印刷用PDFで出力、お客様への施術報告書として |
| 写真拡張 | +500円 | 保存容量20GBに拡張、ビフォーアフター自動並べ替え |
| 来店分析（詳細版） | +500円 | リピート率・来店間隔トレンド・月別集計グラフ |
| LINE通知 | +1,000円 | 次回予約リマインド、施術後フォローメッセージ自動送信 |
| データエクスポート | +300円 | 顧客データ・施術記録のCSVエクスポート |
| 複数スタッフ対応 | +1,000円 | スタッフアカウント追加、権限管理 |

#### 料金シミュレーション例

- **最小構成**: 基本プランのみ → **月2,980円**
  - カルテ＋予約＋来店分析の3本柱で日常業務をカバー
- **標準構成**: 基本 + カウンセリングシート + PDF出力 → **月3,780円**
  - 初回問診のデジタル化と施術報告書の提供
- **フル構成**: 基本 + カウンセリング + 写真拡張 + LINE通知 + 来店分析詳細 → **月5,480円**
  - 既存サービスのKaruteKun（月5,500円〜）と同等の機能で同価格帯、ただし不要な機能を省ける

### ビジネスモデル上のメリット

1. **低い導入障壁**: 月2,980円スタートなので「試してみよう」のハードルが低い
2. **基本プランだけで十分使える**: カルテ+予約+分析の3本柱で日常業務が回る
3. **自然なアップセル**: 使っているうちに「この機能もほしい」が生まれ、ARPU（顧客単価）が自然に上がる
4. **低い解約率**: 自分で選んだ機能だけ払っているので「高い」という不満が生まれにくい
5. **開発の優先順位が明確**: オプションの申込数＝ニーズの強さ。データドリブンで開発できる

### ランニングコスト

| サービス | 現在（無料枠） | 有料化目安 | 月額 |
|---------|--------------|-----------|------|
| Supabase | Free（500MB DB, 1GB Storage） | 顧客10サロン超えたら | $25（約3,800円） |
| Vercel | Free（十分） | アクセス増えたら | $20（約3,000円） |
| ドメイン | なし | 任意 | 約1,000円/年 |
| **合計** | **0円** | | **約6,800円/月** |

**損益分岐点**: 3サロン × 2,980円 = 8,940円 → **3サロンで黒字化**
テスター1名の段階では**コスト0円**で運用可能。

### 収益シミュレーション

月5.1万円の投資回収ラインに対して:

| シナリオ | 顧客数 | 平均単価 | 月間売上 |
|---------|--------|---------|---------|
| 最小 | 10件 | 2,980円 | 29,800円 |
| 中間 | 15件 | 3,500円 | 52,500円 ✅ 回収ライン突破 |
| 目標 | 20件 | 4,000円 | 80,000円 |

平均単価3,500円の場合、15サロンで投資回収ラインを超える。

### テスター期間の料金

- 知り合いの経営者1名に初月は全機能無料で提供
- サロンHP/LPの作成もテスター特典として無料で実施
- 2ヶ月目以降は基本プラン（2,980円）のみ請求
- オプションモジュールはリリース後3ヶ月間は無料で試用可能
- 交換条件: 実績掲載許可、月1回のフィードバック、可能であれば紹介

### 実装上の考慮事項

- オプションの有効/無効を管理するテーブルが必要
- フロントエンド側で有効なモジュールに応じてUI表示を切り替え
- Stripeを使ったサブスク課金の実装（Phase 2以降）
- テスター段階ではサブスク課金は未実装でOK、基本プランの完成度を優先

## 全体の優先順位

1. ~~テスター向け基本プラン完成~~（✅ Phase 1〜1.5で完了）
2. ~~品質改善・パフォーマンス最適化~~（✅ Phase 2〜4で完了）
3. ~~在庫管理・確定申告サポート~~（✅ Phase 5で完了）
4. **テスター経営者のサロンHP/LP作成**（テスター特典・実績づくり）← 次
5. **サロンカルテ自体のLP作成**（新規サロンオーナー獲得用）

## 開発スケジュール

### Phase 1: 基盤構築・コア機能 ✅ 完了
- [x] GitHubリポジトリ作成・初期設定
- [x] Next.js + Tailwind CSS プロジェクトセットアップ
- [x] Supabaseプロジェクト作成・DB構築
- [x] 認証機能（サインアップ/ログイン/ログアウト/パスワードリセット）
- [x] サロン初期設定フロー
- [x] 顧客一覧・検索機能
- [x] 顧客登録・編集・削除
- [x] 顧客詳細画面
- [x] 施術メニューマスタ管理
- [x] 施術記録の作成・編集・削除
- [x] 写真アップロード（カメラ/ギャラリー）
- [x] ビフォーアフター比較表示
- [x] ダッシュボード画面（今日の予約一覧・離脱アラート表示）
- [x] プライバシーポリシー・利用規約ページ
- [x] Vercelデプロイ
- [x] 簡易予約管理（予約CRUD・カレンダー表示・カルテ連動）
- [x] 来店分析 基本版（最終来店日・来店回数・離脱アラート）
- [x] セキュリティ強化（CSP・ファイルバリデーション・EXIF除去）
- [x] 使い方ガイドページ（料金・今後の機能含む）

### Phase 1.5: テスターFB対応 ✅ 完了
テスター（サロンオーナー）からの実運用フィードバックを反映。

#### 優先度A: 顧客情報フィールド追加 ✅ 完了
- [x] DB migration: customersに新カラム追加（address, marital_status, has_children, dm_allowed, height_cm, weight_kg, treatment_goal）
- [x] 顧客新規登録フォームに新フィールド追加（セクション分け: 基本情報/属性情報/施術関連情報）
- [x] 顧客編集フォームに新フィールド追加
- [x] 顧客詳細画面に新フィールド表示+年齢自動表示
- [x] TypeScript型定義更新

#### 優先度B: 施術記録フィールド追加＋汎用化 ✅ 完了
- [x] DB migration: treatment_recordsに新カラム追加（conversation_notes, caution_notes）
- [x] 施術記録作成フォームに新フィールド追加＋ラベル汎用化（「肌の状態」→「施術前の状態」）
- [x] 施術記録編集フォームに新フィールド追加＋ラベル汎用化
- [x] 施術記録詳細画面に新フィールド表示
- [x] ガイドページのラベル汎用化反映

#### 優先度C: 予約のメニュー複数選択 ✅ 完了
- [x] appointment_menusテーブル作成（中間テーブル）+ 既存データバックフィル
- [x] 予約作成フォームでメニュー複数選択UI（チェックボックス、合計時間/金額表示）
- [x] 予約編集フォームでメニュー複数選択UI
- [x] 予約一覧での複数メニュー表示（menu_name_snapshot「、」区切り結合で自動対応）

#### 優先度D: 物販・購入管理 + 回数券管理 ✅ 完了
- [x] purchasesテーブル作成 + RLS
- [x] course_ticketsテーブル作成 + RLS
- [x] 購入記録作成フォーム（customers/[id]/purchases/new）
- [x] 顧客詳細に購入履歴・合計金額表示
- [x] コースチケット登録フォーム（customers/[id]/tickets/new）
- [x] 顧客詳細にチケット残数表示 +「1回使用する」ボタン
- [x] ガイドページに新機能の説明追加

### Phase 2: UI/UX刷新 + 機能拡充 ✅ 完了
テスター運用開始に向けたUI全面改善と機能拡充。

- [x] FABナビゲーション（新規作成: 予約追加/カルテ作成/顧客登録）
- [x] オンボーディングチェックリスト（初期設定ガイド）
- [x] パンくずナビゲーション（全ページ）
- [x] 卒業機能（離脱顧客のステータス管理）
- [x] 誕生日アラート（今月の誕生日をダッシュボードに表示）
- [x] 月別カレンダー表示（予約管理）
- [x] 売上レポート（年間/月別推移グラフ、施術/物販/回数券の内訳）
- [x] 日別ドリルダウン（売上レポートから月→日の詳細表示）
- [x] カテゴリフィルタ（施術/物販/回数券の切替）
- [x] 営業時間設定（settings/business-hours）

### Phase 3: 品質改善・セキュリティ強化 ✅ 完了
パフォーマンス、セキュリティ、データ整合性の包括的修正。

- [x] RLS最適化（IN句サブクエリ統一、全テーブルカバレッジ確認）
- [x] DBトリガー追加（在庫整合性、FK整合性）
- [x] クエリ最適化（必要カラムのみSELECT、不要joinの削除）
- [x] 月別売上サマリーRPC化（get_monthly_sales_summary）
- [x] 離脱顧客RPC化（get_lapsed_customers）
- [x] バグ修正8件（売上グラフ・タイムライン・カレンダー等）

### Phase 4: UI/UX改善（レスポンス・操作性） ✅ 完了
テスター提供品質に向けた操作性の磨き込み。

- [x] Middleware最適化（静的アセットスキップ、パス判定効率化）
- [x] 全クエリ並列化（Promise.all活用、ダッシュボードで9クエリ→1リクエスト）
- [x] 写真アップロード並列化
- [x] 日付フォーマット統一（「○日前」「今日」「昨日」等の相対表示）
- [x] トースト通知コンポーネント（成功/エラー/警告の統一UI）
- [x] エラー時自動スクロール
- [x] CollapsibleSection（カルテフォームの折りたたみUI）
- [x] 下書き自動保存（localStorage活用）
- [x] パンくずナビ全ページ統一
- [x] UI/UX改善17項目（フォーム体験・視覚的フィードバック等）

### Phase 5: 在庫管理 + 確定申告サポート ✅ 完了
商品マスタ・入出庫管理・棚卸し・確定申告レポートの一括実装。

- [x] DB: productsテーブル + inventory_logsテーブル + purchasesテーブル拡張
- [x] RPC: get_inventory_summary / record_product_sale / get_tax_report
- [x] ナビ「売上」→「経営」改名、[売上レポート | 在庫管理] タブ切替UI
- [x] 商品マスタCRUD（名前/カテゴリ/売価/仕入価/発注点/メモ）
- [x] 在庫ダッシュボード（サマリーカード/在庫一覧/クイックアクション/オンボーディング）
- [x] 仕入記録（入庫: purchase_in）
- [x] 消費・廃棄記録（sample_out/waste_out/return_in）
- [x] 棚卸し（全商品の実在庫入力→差分adjustログ一括生成）
- [x] 物販フロー強化: 商品選択/自由入力デュアルモード、在庫自動連動（RPCアトミック処理）
- [x] ダッシュボードに在庫アラート追加（条件付きクエリでパフォーマンス保護）
- [x] 確定申告レポート（売上原価計算/粗利/月別売上・仕入/期末棚卸明細）
- [x] CSV出力3形式（汎用/freee/弥生）

### Phase 6: テスターサロンのHP/LP作成
- [ ] テスターサロンのヒアリング（サロンのコンセプト、メニュー、写真素材等）
- [ ] サロンHP/LPのデザイン・実装
- [ ] 独自ドメイン設定・公開

### Phase 7: サロンカルテのLP作成 + 商用化
- [ ] サロンカルテ自体の宣伝用LP作成（新規サロンオーナー獲得用）
- [ ] テスターの実績・声の掲載
- [ ] 料金プラン・機能紹介の掲載
- [ ] お試しプラン制限（顧客10件・写真なし・予約なし）
- [ ] Stripe課金連携

### 将来Phase: さらなる機能拡張
- [ ] スタッフ管理（複数スタッフ対応）
- [ ] 空き枠表示（予約カレンダー連動）
- [ ] LINE通知（リマインド・フォローメッセージ）
- [ ] カウンセリングシート（デジタル問診票）
- [ ] カルテPDF出力

## テスター運用プラン

### 第1号テスター: 知り合いの経営者1名

目途のついている知り合いのサロン経営者1名に対して、まず無料で提供し実績を作る。

#### 提供内容
- カルテアプリの全機能を無料で提供
- **サロンのHP/LPを特典として作成**（サロン自体にHPがないため）
  - サロンの集客・信頼性向上に直接貢献できる
  - カルテアプリだけでなく「Web周りをまるごとサポートしてくれた」という満足度向上
  - この手作りHP制作の経験を、将来のサロン向けLP自動生成機能（Phase 3）の知見にする

#### 交換条件
- 実績としてサロン名の掲載許可
- 使用感のフィードバック（月1回以上）
- 可能であれば知り合いのサロンオーナーの紹介

#### テスター期間後の移行
- 利用開始1ヶ月後から月額サブスク（月2,980円）で交渉
- オプションモジュールはリリース後3ヶ月間は無料で試用可能

## ディレクトリ構成

```
salon-karte/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── setup/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── update-password/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx           # Server Component, 10クエリ並列
│   │   │   ├── guide/page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── edit/page.tsx
│   │   │   │       ├── purchases/new/page.tsx    # 物販記録（デュアルモード）
│   │   │   │       └── tickets/new/page.tsx      # 回数券登録
│   │   │   ├── records/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/page.tsx
│   │   │   ├── appointments/
│   │   │   │   ├── page.tsx                      # カレンダー（月/週/日）
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── sales/
│   │   │   │   ├── page.tsx                      # 売上レポート
│   │   │   │   └── inventory/
│   │   │   │       ├── page.tsx                  # 在庫ダッシュボード
│   │   │   │       ├── loading.tsx               # スケルトン
│   │   │   │       ├── products/page.tsx         # 商品マスタCRUD
│   │   │   │       ├── receive/page.tsx          # 仕入記録
│   │   │   │       ├── consume/page.tsx          # 消費・廃棄記録
│   │   │   │       ├── stocktake/page.tsx        # 棚卸し
│   │   │   │       └── tax-report/page.tsx       # 確定申告レポート+CSV
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       ├── menus/page.tsx
│   │   │       └── business-hours/page.tsx
│   │   ├── auth/callback/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx                              # ランディングページ
│   │   ├── privacy/page.tsx
│   │   └── terms/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── dashboard-header.tsx              # 上部ヘッダー + 下部ナビ + FAB
│   │   │   └── page-header.tsx                   # パンくず付きページヘッダー
│   │   ├── records/
│   │   │   ├── photo-upload.tsx
│   │   │   └── before-after.tsx
│   │   ├── customers/
│   │   │   └── course-ticket-section.tsx
│   │   ├── dashboard/
│   │   │   └── lapsed-customers-section.tsx
│   │   ├── inventory/
│   │   │   └── management-tabs.tsx               # 売上/在庫タブ切替
│   │   └── ui/
│   │       ├── collapsible-section.tsx
│   │       ├── error-alert.tsx
│   │       └── toast.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── middleware.ts
│   │   │   ├── auth-helpers.ts
│   │   │   └── storage.ts
│   │   ├── format.ts                             # 日付フォーマットユーティリティ
│   │   └── middleware.ts
│   └── types/
│       └── database.ts
├── public/
├── supabase/
│   └── migrations/
│       ├── 00001_initial_schema.sql
│       ├── 00002_storage_bucket.sql
│       ├── 00003_appointments.sql
│       ├── 00004_add_customer_fields_phase_1_5.sql
│       ├── 00005_add_treatment_record_fields_phase_1_5.sql
│       ├── 00006_appointment_menus.sql
│       ├── 00007_purchases.sql
│       ├── 00008_course_tickets.sql
│       ├── 00009_lapsed_customers_function.sql
│       ├── 00010_business_hours.sql
│       ├── 00011_security_and_integrity_fixes.sql
│       └── 00012_inventory_management.sql
├── .env.local
├── next.config.ts
├── tsconfig.json
├── package.json
├── PLAN.md
└── README.md
```

## テスターフィードバック記録

### 第1回フィードバック（テスター: エステサロンオーナー）

#### 顧客情報
- 住所が必要（郵送物対応）
- 年齢の自動表示が欲しい（生年月日から計算）
- 婚姻状況（未婚/既婚）が欲しい
- お子様の有無
- DM送付可否
- 身体情報（身長・体重等）→ 痩身/バスト系サロンでは必須
- 施術の最終目標（フリーテキスト）

#### カルテ（施術記録）
- 「肌の状態」はフェイシャル限定すぎる → 汎用化して「施術前の状態」に
- 話した内容（会話メモ）を記録したい
- 注意事項フィールドが欲しい
- エステ以外のサロン（リラク、痩身、バスト、ネイル、アイラッシュ等）にも対応したい

#### 予約管理
- 1回の予約で複数メニューを選択したい
- スタッフの割り当てが欲しい（将来）
- 営業日・休日の設定（将来）
- 空き時間枠の表示（将来）

#### 物販・購入管理（新機能要望）
- 商品の購入記録を管理したい
- コースチケット（回数券）の残数管理
- 顧客ごとの累計購入金額の表示

#### 料金に対する印象
- 現在Excel自己管理で年間約20,000円相当のコスト
- 月額2,980円（年36,000円）は「とても魅力的」
- 機能が合えば他のオーナーにも勧めたいとのこと

#### 対応方針・対応状況
- 顧客情報・カルテのフィールド追加 → ✅ Phase 1.5で対応済み
- ラベルの汎用化 → ✅ Phase 1.5で対応済み
- 物販管理・予約メニュー複数選択 → ✅ Phase 1.5で対応済み
- 商品在庫管理・確定申告 → ✅ Phase 5で対応済み
- 営業日設定 → ✅ Phase 2で対応済み
- スタッフ管理・空き枠表示 → 将来Phaseで対応予定

## 注意事項・Claude Code向けメモ

- スマホでの操作が最優先。デスクトップは後回しでOK
- 日本語UI。ラベル、プレースホルダー、エラーメッセージすべて日本語
- フォームのバリデーションは日本の電話番号形式に対応
- 写真はSupabase Storageのprivateバケットに保存し、署名付きURLで表示
- 全テーブルにRLSを必ず設定すること（個人情報を扱うため最重要）
- Supabaseの型定義は `npx supabase gen types typescript` で自動生成する
- コンポーネントは可能な限りServer Componentsを使い、クライアントは最小限に
- エラーハンドリングはユーザーフレンドリーなメッセージを日本語で表示
