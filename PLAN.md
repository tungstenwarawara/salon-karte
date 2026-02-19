# サロンカルテ — エコシステム計画書（統合版）

> 更新日: 2026-02-19（v4 — PLAN.md + V3計画書を統合。Phase 5完了を反映）

---

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [競合調査・市場分析](#競合調査市場分析)
3. [料金プラン設計](#料金プラン設計)
4. [差別化ポイント](#差別化ポイント)
5. [実装済み機能一覧](#実装済み機能一覧)
6. [画面構成（30ページ）](#画面構成30ページ)
7. [アーキテクチャ設計 — 3プロダクト体制](#アーキテクチャ設計--3プロダクト体制)
8. [データベース設計](#データベース設計)
9. [在庫管理 詳細設計（✅ 実装済み）](#在庫管理-詳細設計-実装済み)
10. [UI/UX設計](#uiux設計)
11. [開発ロードマップ](#開発ロードマップ)
12. [各プロダクト仕様・見積もり](#各プロダクト仕様見積もり)
13. [技術スタック](#技術スタック)
14. [テスター運用プラン](#テスター運用プラン)
15. [注意事項・Claude Code向けメモ](#注意事項claude-code向けメモ)
16. [参考リンク](#参考リンク)

---

## プロジェクト概要

個人エステサロン向けの「カルテ管理 + 予約管理 + 来店分析 + 在庫管理 + 確定申告サポート」のWebアプリ。
既存サービス（月額5,500〜21,000円）が抱える「多機能すぎて高い」問題を解決し、
本当に必要な機能だけを月額2,980円で提供する。
使いたい機能を追加するたびに課金していくモジュール型サブスクモデル。

### ターゲットユーザー

- 個人経営のエステサロンオーナー（1人〜少人数運営）
- 現在、紙カルテやExcelで顧客管理している
- ITリテラシーは高くない（スマホは使えるがPCは苦手な層）
- 予約管理はホットペッパーや電話・LINEなど複数チャネルで受けている

---

## 競合調査・市場分析

### 価格比較サマリー

| サービス | 月額（個人想定） | 初期費用 | カルテ | 予約 | 回数券 | LINE | 在庫 | HP/EC | 確定申告 | ターゲット |
|---------|-----------------|---------|-------|------|-------|------|------|-------|---------|-----------|
| Bionly FREE | 0円 | 0円 | ○(制限) | ○ | - | - | - | - | - | 美容室/エステ |
| LiME 無料 | 0円 | 0円 | 5枚/人 | 5件/月 | - | - | - | - | - | 美容師 |
| Square 予約 | 0~3,300円 | 0円 | x | ○ | - | - | ○ | - | - | 全業種 |
| **salon-karte** | **2,980円** | **0円** | **○無制限** | **○** | **○** | **計画中** | **✅** | **計画中** | **✅** | **エステ** |
| KaruteKun | 5,500円 | 0円 | ○ | ○ | - | +5,500円 | - | - | - | サロン全般 |
| Bionly 有料 | 10,780円 | 0円 | ○ | ○ | - | - | ○ | - | - | 美容室/エステ |
| BeSALO | 要問合 | 要問合 | ○ | ○ | ○ | ○ | ○ | - | - | 大規模 |
| サロンアンサー | 10,780円~ | 130,000円 | ○ | ○ | - | +6,800円 | - | - | - | 美容室 |
| リザービア | 21,000円~ | 100,000円 | 簡易 | ○ | - | +4,500円 | - | - | - | サロン全般 |
| Salon.EC | 0円 | 0円 | - | - | - | - | ○ | EC | - | EC特化 |

### 市場の隙間（salon-karteが狙えるポジション）

1. **カルテ+予約+回数券+物販** を2,980円で提供 → 競合に同等プランなし
2. **在庫管理** まで対応するカルテ管理は BeSALO（高価格帯）しかない
3. **HP+Web予約+SEO** を一体提供するカルテ管理は存在しない
4. **EC+カルテ連動** は市場に存在しない（Salon.ECはカルテ非対応）
5. **確定申告サポート（売上原価・棚卸明細の自動集計）** を提供するカルテ管理は **皆無**

→ **「カルテから在庫・HP・ECまで全てつながり、確定申告もラクになる」= 唯一無二のポジション**

---

## 料金プラン設計

### 基本プラン: 2,980円/月（税込）

| 含まれる機能 | 競合との優位性 |
|------------|-------------|
| 電子カルテ（枚数無制限） | LiME無料は5枚/人制限 |
| ビフォーアフター写真（5GB） | エステ特化の差別化ポイント |
| 顧客管理（人数無制限） | Bionly FREEはスタッフ1名制限 |
| 予約管理（営業日設定・空き時間表示） | KaruteKunと同等 |
| 施術メニュー管理 | 複数メニュー選択対応 |
| 物販購入履歴 | **競合の大半が未対応** |
| 回数券・コース管理 | **エステの売上の柱。ほぼ全競合が未対応** |
| 月間売上集計（施術+物販+回数券） | 3軸の集計は独自 |
| 離脱顧客アラート | 60日/90日で自動検出 |
| 来店分析（基本） | 来店回数・間隔・最終来店日 |

### お試しプラン: 0円
- 顧客10件まで
- 写真保存・予約管理なし

### オプション機能（salon-karte内）

| オプション | 価格 | 状態 |
|-----------|------|------|
| **在庫管理+確定申告サポート** | +500円/月 | ✅ 実装済み |
| カウンセリングシート（デジタル問診票） | +500円/月 | 計画中 |
| LINE連携（予約リマインド・フォロー通知） | +1,500円/月 | 計画中 |
| カルテPDF出力 | +300円/月 | 計画中 |
| データエクスポート（CSV） | +300円/月 | 計画中 |
| 写真容量拡張（5GB→20GB） | +500円/月 | 計画中 |
| 詳細分析レポート（LTV・リピート率・グラフ） | +500円/月 | 計画中 |
| 複数スタッフ対応（権限管理） | +1,500円/月 | 計画中 |

### 別プロダクト料金

| プロダクト | 月額 | 初期費用 | 備考 |
|-----------|------|---------|------|
| salon-site（HP+Web予約） | 3,980円/月 | 0円 | SEO最適化済み |
| salon-ec（ECサイト） | 2,980円/月 | 0円 | カルテ顧客連動 |
| セット割（カルテ+HP+EC） | 7,980円/月 | 0円 | 通常9,940円 → 約20%OFF |

### 料金シミュレーション

```
パターン1「カルテだけ」           = 2,980円
パターン2「カルテ + 在庫管理」     = 3,480円
パターン3「カルテ + 在庫 + 問診票 + LINE」 = 5,480円
パターン4「カルテ + HP」          = 6,960円（ホットペッパー月2.5万の1/4以下）
パターン5「全部入り」             = 約13,760円（リザービア21,000円+初期10万より安い）
```

### ランニングコスト・損益分岐点

| サービス | 現在（無料枠） | 有料化目安 | 月額 |
|---------|--------------|-----------|------|
| Supabase | Free（500MB DB, 1GB Storage） | 顧客10サロン超えたら | $25（約3,800円） |
| Vercel | Free（十分） | アクセス増えたら | $20（約3,000円） |
| ドメイン | なし | 任意 | 約1,000円/年 |
| **合計** | **0円** | | **約6,800円/月** |

**損益分岐点**: 3サロン × 2,980円 = 8,940円 → **3サロンで黒字化**

---

## 差別化ポイント

### 1. エステ特化のカルテ機能
- 競合の大半は美容室（ヘアサロン）向け
- ビフォーアフター写真管理、施術前の状態記録、肌の経過記録
- エステサロンに必要な情報項目を標準装備

### 2. 初期費用0円 + 月額2,980円
- リザービア: 初期10万 + 月2.1万 / サロンアンサー: 初期13万 + 月1万
- → salon-karteは0円スタートで圧倒的に導入しやすい

### 3. 回数券・物販管理が基本機能
- エステでは回数券が売上の柱、物販も重要な収益源
- これらが基本料金に含まれるのはほぼ唯一

### 4. エコシステム連携
- カルテ ↔ 在庫管理: 物販記録で自動在庫引落し
- カルテ ↔ HP: 顧客がWeb予約 → カルテの予約に自動反映（将来）
- カルテ ↔ EC: EC購入履歴 → カルテの顧客に自動紐付け（将来）

### 5. 確定申告がラクになる（競合ゼロの差別化）
- 物販の売上・仕入を記録するだけで、年末に確定申告用データが自動生成
- freee/弥生にインポートできるCSV形式対応

---

## 実装済み機能一覧

### コア機能（基本プランに含まれる）

| カテゴリ | 機能 | 状態 |
|---------|------|------|
| 顧客管理 | 一覧（カナ検索・ソート・離脱アラート色分け） | ✅ |
| | 新規登録・編集・削除 | ✅ |
| | 詳細（来店分析・売上サマリー） | ✅ |
| 施術カルテ | 作成・詳細・編集・削除 | ✅ |
| | ビフォーアフター写真（分類・メモ付き、5GB） | ✅ |
| 予約管理 | 一覧（日別/週別/月別ビュー） | ✅ |
| | 新規・編集・ステータス管理・重複チェック | ✅ |
| | 複数メニュー選択・終了時間自動計算 | ✅ |
| | 営業時間設定・空き時間スロット表示・休業日/営業時間外警告 | ✅ |
| 売上管理 | 月間売上集計（施術/物販/回数券）+ 月別推移 + 日別ドリルダウン | ✅ |
| | 顧客単位の売上サマリー | ✅ |
| 物販管理 | 購入記録の登録・一覧（商品選択/自由入力デュアルモード） | ✅ |
| | 物販登録→在庫自動減算（RPCアトミック処理） | ✅ |
| 回数券管理 | チケット登録・消化管理・有効期限 | ✅ |
| 在庫管理 | 商品マスタCRUD・在庫ダッシュボード・仕入/消費/廃棄/棚卸し | ✅ |
| | ダッシュボード在庫アラート（発注点以下を警告） | ✅ |
| 確定申告 | レポート（売上原価・棚卸明細・月別売上/仕入）+ CSV出力3形式 | ✅ |
| メニュー管理 | CRUD・カテゴリ・所要時間・料金 | ✅ |
| 営業時間 | 曜日別の営業/休業・開閉店時間管理 | ✅ |
| UI/UX | FAB・ボトムナビ5項目・パンくず・オンボーディング・経営タブ | ✅ |
| その他 | 離脱アラート・スケルトン・キャッシュ最適化・セキュリティヘッダー | ✅ |

---

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

---

## アーキテクチャ設計 — 3プロダクト体制

```
┌─────────────────────────────────────────────────┐
│                Supabase (共有DB)                  │
│   salons / customers / appointments / records    │
│   products / inventory_logs / orders / pages     │
├─────────────┬────────────────┬───────────────────┤
│ salon-karte │  salon-site    │    salon-ec       │
│ (カルテ管理)│ (HP+Web予約)   │   (ECサイト)      │
│ + 在庫管理  │                │                   │
│ + 確定申告  │                │                   │
│ Vercel App  │  Vercel App    │   Vercel App      │
│ /管理者専用  │ /公開サイト     │  /ECストア        │
└─────────────┴────────────────┴───────────────────┘
```

### 分割判断基準

| 判断軸 | 在庫管理 | HP+Web予約 | EC |
|-------|---------|-----------|-----|
| ユーザー | オーナー（同じ人） | オーナー + エンド顧客 | オーナー + エンド顧客 |
| 認証基盤 | 同じ | 別（顧客は匿名/簡易認証） | 別（顧客はEC会員） |
| ドメイン | 管理系（B向け） | 公開系（C向け） | 公開系（C向け） |

### データ連携フロー

```
[salon-karte] 物販登録 → purchases INSERT + inventory_logs INSERT (自動出庫)
[salon-karte] 仕入登録 → inventory_logs INSERT (入庫)
[salon-site]  Web予約  → appointments INSERT (status='pending')（将来）
[salon-ec]    EC購入   → ec_orders INSERT + inventory_logs INSERT（将来）
[salon-karte] 確定申告 → 全テーブルを集計して年次レポート生成
```

---

## データベース設計

### テーブル構成（11テーブル + 12マイグレーション）

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
  skin_type TEXT,
  allergies TEXT,
  notes TEXT,
  address TEXT,
  marital_status TEXT,
  has_children BOOLEAN,
  dm_allowed BOOLEAN DEFAULT true,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  treatment_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 施術メニューマスタ
CREATE TABLE treatment_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
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
  menu_name_snapshot TEXT,
  treatment_area TEXT,
  products_used TEXT,
  skin_condition_before TEXT,
  notes_after TEXT,
  next_visit_memo TEXT,
  conversation_notes TEXT,
  caution_notes TEXT,
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
  menu_name_snapshot TEXT,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status TEXT NOT NULL DEFAULT 'scheduled',
  source TEXT DEFAULT 'direct',
  memo TEXT,
  treatment_record_id UUID REFERENCES treatment_records(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 予約メニュー中間テーブル
CREATE TABLE appointment_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  menu_name_snapshot TEXT NOT NULL,
  duration_snapshot INTEGER,
  price_snapshot INTEGER
);

-- 物販・購入記録
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
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  cost_price INTEGER,
  sell_price INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 回数券管理
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

-- 商品マスタ（Phase 5）
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

-- 在庫ログ（Phase 5）
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN (
    'purchase_in','sale_out','sample_out','waste_out','adjust','return_in'
  )),
  quantity INTEGER NOT NULL,
  unit_cost_price INTEGER,
  unit_sell_price INTEGER,
  reason TEXT,
  related_purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RPC関数（5つ）

| 関数名 | 用途 |
|--------|------|
| `get_monthly_sales_summary(p_salon_id, p_year)` | 月別売上集計（施術/物販/回数券） |
| `get_lapsed_customers(p_salon_id, p_days_threshold)` | 離脱顧客の検出 |
| `get_inventory_summary(p_salon_id)` | 全商品の在庫サマリー |
| `record_product_sale(...)` | 物販登録+自動出庫のアトミック処理 |
| `get_tax_report(p_salon_id, p_year)` | 確定申告用の年間集計データ |

### RLS方針

全テーブルにRLSを有効化し、`salon_id`ベースでアクセス制御。
オーナーは自分のサロンのデータのみ閲覧・編集可能。

---

## 在庫管理 詳細設計（✅ 実装済み）

### 在庫増減パターン

| パターン | log_type | quantity | トリガー | 実装状態 |
|---------|----------|----------|---------|----------|
| 仕入れ | `purchase_in` | +N | 手入力（仕入記録画面） | ✅ |
| 店頭販売 | `sale_out` | -N | 物販登録で自動（`record_product_sale` RPC） | ✅ |
| サンプル使用 | `sample_out` | -N | 手入力（消費・廃棄画面） | ✅ |
| 破損・廃棄 | `waste_out` | -N | 手入力（消費・廃棄画面） | ✅ |
| 棚卸し調整 | `adjust` | ±N | 棚卸し画面で入力 | ✅ |
| 返品 | `return_in` | +N | log_type定義のみ（画面未実装） | 🔲 |

> **注意**: ネット販売（EC）による在庫減算は salon-ec 開発時にまとめて対応予定。
> 現時点では「顧客に紐づく店頭物販」のみ自動在庫連動。
> EC販売用の log_type（`ec_out` 等）は salon-ec 開発時にDBマイグレーションで追加する。

### 価格管理の考え方

- `base_sell_price` / `base_cost_price` = マスタ上の「いつもの価格」
- 実際の取引では都度の価格を `unit_cost_price` / `unit_sell_price` に記録
- 粗利計算は最終仕入原価法に基づく（確定申告で使う標準的な方法）

### 物販登録→自動出庫フロー（店頭販売）

```
顧客詳細 → 物販を記録 → [商品から選ぶ] タブ
→ 商品選択（売価自動セット）→ 数量入力 → 保存
→ record_product_sale() RPCが1トランザクションで実行:
   ① purchases に物販レコードINSERT
   ② inventory_logs に sale_out（-N）INSERT
   ③ 残り在庫数を返却 → 画面に表示
   ④ 在庫≤発注点 → 次回ダッシュボード表示時にアラート
```

**[自由入力] モードの場合**: 従来通り手動で商品名・金額を入力。在庫連動なし。
商品マスタに登録していない商品や一度きりの販売に使用。

### 確定申告レポートの出力内容

- 売上原価計算（期首棚卸高 + 仕入高 - 期末棚卸高 = 売上原価）
- 月別売上内訳（施術/物販/回数券）
- 月別仕入金額
- 期末棚卸明細（最終仕入原価法）
- 粗利サマリー
- CSV出力（freee形式 / 弥生形式 / 汎用）

### 棚卸しフロー

全商品の一覧表示 → 実在庫を数値入力 → 差分を自動計算 → 確定でadjustログ一括生成

---

## UI/UX設計

### 基本原則
- **モバイルファースト**: 施術の合間にスマホで操作することを前提
- **タップ数最小化**: 主要操作は3タップ以内
- **大きなタッチターゲット**: ボタンは最低44px以上
- **やさしい配色**: エステサロンの雰囲気に合うナチュラル系カラー

### カラーパレット
- Primary: #8B7B6B（ウォームグレー）
- Accent: #C4956A（ゴールドベージュ）
- Background: #FAF8F5（オフホワイト）
- Text: #3D3D3D / Success: #7BAE7F / Warning: #E8A87C

### ナビゲーション（✅ 実装済み）

```
[ホーム] [予約] [+新規(FAB)] [顧客] [経営]
                  ↑
         タップで展開:
         ├ 予約を追加
         ├ カルテを書く
         └ 顧客を登録
```

- FAB（＋ボタン）を中央に配置 → 主要アクションの入口を1箇所に集約
- 設定/ガイドはヘッダーに移動

### UI/UX改善方針（「迷わないUI」5原則）

1. **1タップで目的地** — よく使う機能はホームから1タップ
2. **文脈ナビゲーション** — 今いる画面から次のアクションが自然に見える
3. **プログレッシブ開示** — 初心者には基本だけ見せ、慣れたら高度な機能を発見
4. **視覚的ガイド** — アイコン・色・バッジで状態を即座に理解
5. **安心フィードバック** — 保存成功・エラー・未保存状態を明確に

### 将来の改善（未実装）
- フォームのステップ分割・自動保存
- 機能ディスカバリー（ツールチップ・ナッジ）

---

## 開発ロードマップ

### Phase 1: 基盤構築・コア機能 ✅ 完了
- [x] Next.js + Supabase + Vercel セットアップ
- [x] 認証・顧客CRUD・カルテ・写真・予約・来店分析・セキュリティ

### Phase 1.5: テスターFB対応 ✅ 完了
- [x] 顧客情報フィールド追加（住所・婚姻・身体情報等）
- [x] カルテ項目追加＋ラベル汎用化
- [x] 予約メニュー複数選択
- [x] 物販・回数券管理

### Phase 2: UI/UX刷新 + 機能拡充 ✅ 完了
- [x] FAB・オンボーディング・パンくず・卒業機能・誕生日アラート
- [x] 月別カレンダー・売上レポート・日別ドリルダウン・営業時間設定

### Phase 3: 品質改善・セキュリティ強化 ✅ 完了
- [x] RLS最適化・DBトリガー・クエリ最適化・RPC化・バグ修正8件

### Phase 4: UI/UX改善（レスポンス・操作性） ✅ 完了
- [x] Middleware最適化・全クエリ並列化・トースト・CollapsibleSection・下書き自動保存

### Phase 5: 在庫管理 + 確定申告サポート ✅ 完了
- [x] products + inventory_logs + 3 RPC
- [x] 商品マスタ・在庫ダッシュボード・仕入/消費/棚卸し
- [x] 物販デュアルモード・自動出庫・在庫アラート
- [x] 確定申告レポート・CSV出力3形式

### Phase 6: 売上・回数券の会計修正 ← 次

**課題**: 施術売上と回数券売上が二重計上されている
- 予約完了時、`appointment_menus.price_snapshot` が全額 treatment_sales に計上
- 回数券購入時、`course_tickets.price` が ticket_sales に計上
- 回数券で支払った施術も treatment_sales に含まれ、**合計が実際の収入より膨らむ**

**現状の構造的問題**:
- `appointment_menus` に「支払方法（現金/回数券）」の区分がない
- `course_tickets` に「どのメニューに使えるか」の紐づけがない
- 1予約内で「メニューAは回数券、メニューBは現金」の混在が表現できない

**対応方針（要設計）**:
1. `appointment_menus` に `payment_type` (cash/ticket) + `ticket_id` カラム追加
2. `course_tickets` にメニュー紐づけ（任意）を追加
3. 回数券消化時に `appointment_menus.payment_type = 'ticket'` を記録
4. `get_monthly_sales_summary` を修正: treatment_sales から ticket支払い分を除外
5. 確定申告レポートも同様に修正
6. 回数券 = 前受金として会計的に正しく処理

### Phase 7: テスターサロンのHP/LP作成
- [ ] テスターサロンのヒアリング（コンセプト、メニュー、写真素材等）
- [ ] サロンHP/LPのデザイン・実装
- [ ] 独自ドメイン設定・公開

### Phase 8: サロンカルテのLP作成 + 商用化
- [ ] サロンカルテ自体の宣伝用LP作成
- [ ] テスターの実績・声の掲載
- [ ] お試しプラン制限・Stripe課金連携

### 将来Phase: カルテ追加機能（Phase 6.0相当）

| # | 施策 | 工数目安 |
|---|------|---------|
| 1 | カウンセリングシート（テンプレート作成 + 回答管理） | 1.5日 |
| 2 | LINE連携（Messaging API + リマインド自動送信） | 2日 |
| 3 | CSV エクスポート | 0.5日 |
| 4 | カルテPDF出力 | 1日 |
| 5 | 詳細分析レポート（グラフ + LTV算出） | 1.5日 |

### 将来Phase: salon-site（HP+Web予約 — 別アプリ）

| # | 施策 | 工数目安 |
|---|------|---------|
| 1 | プロジェクトセットアップ（Next.js + Supabase共有） | 0.5日 |
| 2 | テンプレートエンジン（サロン情報からHP自動生成） | 2日 |
| 3 | SEO最適化（構造化データ・メタ・sitemap・OGP） | 1日 |
| 4 | Web予約フォーム（空き枠連動） | 2日 |
| 5 | Google ビジネスプロフィール連携（MEO対策） | 1日 |
| 6 | カスタムドメイン対応 | 0.5日 |
| 7 | デザインカスタマイズ + ブログ | 2.5日 |

#### SEO戦略

```
勝てるキーワード:
  「[サロン名]」「[サロン名] 口コミ」「[サロン名] 予約」
  「[地域名] フェイシャルエステ 個人サロン」
  「[施術名] 効果 [地域名]」

技術的SEO: Next.js SSG/ISR, JSON-LD, sitemap, OGP, モバイルファースト
コンテンツSEO: サロン紹介/メニュー詳細/ブログ/ビフォアフター事例/FAQ
MEO対策: Google ビジネスプロフィール連携, 構造化データ, Maps埋め込み
```

### 将来Phase: salon-ec（ECサイト — 別アプリ）

| # | 施策 | 工数目安 |
|---|------|---------|
| 1 | プロジェクトセットアップ（Next.js + Stripe + Supabase） | 1日 |
| 2 | 商品カタログ（商品マスタ連動） | 1日 |
| 3 | カート + Stripe Checkout 決済 | 2日 |
| 4 | 注文管理 + 顧客連動 + 在庫連動 | 2.5日 |
| 5 | 配送管理 + SEO + 特商法ページ | 2日 |

---

## 各プロダクト仕様・見積もり

| プロダクト | 工数 | 月額収益/サロン | 状態 |
|-----------|------|---------------|------|
| salon-karte Phase 1〜5 | — | 2,980円 + 500円 | ✅ 完了 |
| salon-karte カルテ追加機能 | 約6.5日 | +500〜1,500円 | 計画中 |
| salon-site（HP+Web予約） | 約9.5日 | 3,980円 | 計画中 |
| salon-ec（ECサイト） | 約8.5日 | 2,980円 | 計画中 |
| **残り合計** | **約24.5日** | **最大 9,940円/サロン** | |

```
実績 + 想定タイムライン:
  〜2月中旬:     Phase 1〜5（カルテ基盤+在庫+確定申告）  ✅ 完了
  3月前半〜中:   Phase 6（テスターサロンHP）
  3月後半〜:     Phase 7（サロンカルテLP+商用化）
  以降:          カルテ追加機能 / salon-site / salon-ec
```

---

## 技術スタック

### 共通基盤

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 |
| バックエンド | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| ホスティング | Vercel |
| DB | 12マイグレーション、11テーブル、5 RPC関数 |

### salon-site 追加技術（将来）

Next.js SSG/ISR / JSON-LD / Vercel Domains API

### salon-ec 追加技術（将来）

Stripe Checkout / Stripe Webhooks / Supabase Edge Functions

---

## テスター運用プラン

### 第1号テスター: 知り合いの経営者1名

#### 提供内容
- カルテアプリの全機能を無料で提供
- **サロンのHP/LPを特典として作成**

#### 交換条件
- 実績としてサロン名の掲載許可
- 使用感のフィードバック（月1回以上）
- 可能であれば知り合いのサロンオーナーの紹介

#### テスター期間後
- 利用開始1ヶ月後から月額2,980円
- オプションモジュールはリリース後3ヶ月間無料

### テスターフィードバック記録

#### 第1回（エステサロンオーナー）
- 顧客情報・カルテのフィールド追加 → ✅ Phase 1.5で対応済み
- ラベルの汎用化 → ✅ Phase 1.5で対応済み
- 物販管理・予約メニュー複数選択 → ✅ Phase 1.5で対応済み
- 商品在庫管理・確定申告 → ✅ Phase 5で対応済み
- 営業日設定 → ✅ Phase 2で対応済み
- スタッフ管理・空き枠表示 → 将来Phaseで対応予定
- 月額2,980円は「とても魅力的」との評価

---

## ディレクトリ構成

```
salon-karte/
├── src/
│   ├── app/
│   │   ├── (auth)/login, signup, setup, reset-password, update-password
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx           # Server Component, 10クエリ並列
│   │   │   ├── guide/page.tsx
│   │   │   ├── customers/                   # 一覧/新規/[id]/edit/purchases/tickets
│   │   │   ├── records/                     # new/[id]/edit
│   │   │   ├── appointments/                # 一覧/new/[id]/edit
│   │   │   ├── sales/
│   │   │   │   ├── page.tsx                 # 売上レポート
│   │   │   │   └── inventory/               # 在庫ダッシュボード/products/receive/consume/stocktake/tax-report
│   │   │   └── settings/                    # menus/business-hours
│   │   ├── auth/callback/route.ts
│   │   ├── page.tsx                         # ランディングページ
│   │   ├── privacy/page.tsx
│   │   └── terms/page.tsx
│   ├── components/
│   │   ├── layout/                          # dashboard-header, page-header
│   │   ├── records/                         # photo-upload, before-after
│   │   ├── customers/                       # course-ticket-section
│   │   ├── dashboard/                       # lapsed-customers-section
│   │   ├── inventory/                       # management-tabs
│   │   └── ui/                              # collapsible-section, error-alert, toast
│   ├── lib/supabase/, format.ts, middleware.ts
│   └── types/database.ts
├── supabase/migrations/                     # 00001〜00012
├── PLAN.md                                  # ← このファイル（唯一の計画書）
└── README.md
```

---

## 全体の優先順位

1. ~~テスター向け基本プラン完成~~（✅ Phase 1〜1.5で完了）
2. ~~品質改善・パフォーマンス最適化~~（✅ Phase 2〜4で完了）
3. ~~在庫管理・確定申告サポート~~（✅ Phase 5で完了）
4. **テスター経営者のサロンHP/LP作成**（テスター特典・実績づくり）← 次
5. **サロンカルテ自体のLP作成**（新規サロンオーナー獲得用）

---

## 注意事項・Claude Code向けメモ

- スマホでの操作が最優先。デスクトップは後回しでOK
- 日本語UI。ラベル、プレースホルダー、エラーメッセージすべて日本語
- フォームのバリデーションは日本の電話番号形式に対応
- 写真はSupabase Storageのprivateバケットに保存し、署名付きURLで表示
- 全テーブルにRLSを必ず設定すること（個人情報を扱うため最重要）
- コンポーネントは可能な限りServer Componentsを使い、クライアントは最小限に
- エラーハンドリングはユーザーフレンドリーなメッセージを日本語で表示

---

## 参考リンク

- [エステサロンのSEO対策完全ガイド（2026年版）](https://devo.jp/seolaboratory/104327/)
- [美容室のSEOはコンテンツSEOが最適](https://ledeal.co.jp/info/beautysalon-seo-va/)
- [Salon.EC — 美容サロン向けECサービス](https://salon.ec/)
- [BeSALO — 在庫管理機能付きサロン管理](https://www.be-salo.com/)
- [2026年版 サロン予約システム比較](https://notepm.jp/blog/11512)
- [エステサロン開業の確定申告ガイド](https://www.felicite-kobe.net/column/archives/5336)
- [個人事業主の棚卸資産について](https://www.zeitetsuzuki.jp/15663628684836)
- [freee 棚卸資産の残高登録方法](https://support.freee.co.jp/hc/ja/articles/202849130)
- [個人事業主は在庫に注意](https://www.all-senmonka.jp/moneyizm/management/1213/)
