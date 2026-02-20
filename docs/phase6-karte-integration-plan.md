# カルテ・予約・物販の動線再整理 — Phase 6 実装計画（確定版）

> 作成日: 2026-02-20
> 最終更新: 2026-02-20（テスター回答⑥〜⑩ + Excel実物 + メニュー表 + ⑧オプション金額修正を反映）
> ステータス: **✅ 計画確定・実装待ち**

---

## テスターのサロン概要

**銀座バスト専門店SEI** — バストケア特化のエステサロン

### メニュー構成

| メニュー | 時間 | 単発 | 2回券 |
|---------|------|------|-------|
| オーダーメイドバストメイクコース | 80分 | ¥25,000 | ¥40,000 |
| オールハンド乳腺デザインコース | 60分 | ¥20,000 | ¥30,000 |
| プレミアム温熱ヒーリング（上半身/背面） | 70分〜 | ¥25,000 | — |
| プレミアム温熱ヒーリング（全身） | 70分〜 | ¥30,000 | — |
| オーダーメイドプラスケア（オプション） | — | ¥3,000〜 | — |

**オプション部位**: 腹¥3,000 / デコルテ・腕¥5,000 / 後足¥9,000
**ローマピンク（色素ケア）**: ¥65,000〜¥280,000（部位別、キャンペーン価格あり）

### ビジネスモデル

```
新規 → 体験（¥25,000等、キャンペーンで変動）
     → 気に入ったら回数券購入（会員化）
     → 2回券(¥40,000)がメイン商材
     → 消化2回目に次の2回券を購入（継続）
     → チケット消化完了 + 未購入 = 卒業（離脱）

キャンペーン例:
  ★ 10回券 ¥180,000（新規獲得用）
  ★ 10回購入で1回コースサービス（11回受けられる）
  ★ 10回購入でオプション1回サービス
```

### 売上の考え方

- **回数券購入時に一括売上計上**（パターンA）
- 施術消化時には売上は立たない（消化記録のみ）
- オプションは回数券消化 or 当日現金の2パターン
- **現金 vs クレジットの区分が必要**（確定申告のカード手数料対策）

---

## テスターの現在のExcel管理（3シート）

### 1. 売上管理表（月次、日別行）

```
列: 日付 | 来店人数 | 新規 | 現金 | クレジット | 回数券 |
     売上合計 | 物販売上 | 回数券消化金額 | 総売上 |
     顧客名＆売上詳細 | 回数券購入 | 商品購入 | メモ

集計:
  月次売上 / 月次利益 / 未消化分合計（前受金）/ 今月消化
  コース消化のみ利益 / 目標金額 / 目標まで残額
```

**特徴**: 1日に複数行（複数顧客）、支払方法4区分

### 2. カルテ（顧客別タブ）

```
列: 日付 | 施術内容（長文） | コース(消化=1) | オプション |
     残コース | 体験 | 回数券数 | サービス | オプション |
     合計来店回数 | 体験金額 | 商品購入金額 | 購入内容 |
     回数券購入金額 | 合計購入金額 | 写真

ヘッダー行: 全列の累計（コース103回、合計来店105回、商品購入¥2,526,224等）
```

**特徴**: 1行 = 1来店。施術・消化・購入・物販が全部同じ行

### 3. 在庫リスト（年別タブ）

```
列: 商品名 | 前年繰越 | 在庫 | 棚卸 |
     月別発注数(1月〜12月) | 月別売上数(1月〜12月) | 在庫合計金額 |
     仕入外（月別）
```

**テスターの評価**: 在庫とカルテが見づらい。売上管理は慣れている。

---

## 根本原因

Excelでは **1行に1来店の全てが入る** のに、salon-karteでは **4画面に分散**:
- 施術内容 → `/records/new`
- 回数券消化 → 自動だが選択UIなし
- 回数券購入 → `/customers/{id}/tickets/new`（別画面）
- 商品購入 → `/customers/{id}/purchases/new`（別画面）

### 構造的問題

1. **予約は複数メニュー対応なのにカルテは1メニューのみ**
2. **物販・回数券購入がカルテと完全独立**
3. **支払方法（現金/クレジット/回数券）の記録がない**
4. **売上二重計上**（回数券消化分もtreatment_salesに含まれる）
5. **未消化分合計（前受金）の集計がない**

---

## 改善後のデータフロー（目標）

```
予約作成 → 複数メニュー選択 ✓
    ↓
予約完了 → カルテ作成（メニュー自動引き継ぎ）
    ↓
カルテ作成画面（1画面で完結）:
  ├─ 施術メニュー（複数選択）
  │    ├─ バストメイクコース（回数券Aから消化）
  │    └─ 腹オプション（当日現金¥3,000）
  ├─ 施術記録（部位・メモ・写真）
  ├─ 回数券購入（任意）← 新しい2回券¥40,000を販売
  └─ 物販記録（任意）← エラスチン¥17,280
    ↓
顧客詳細ページ:
  日付 | 施術概要 | コース | 物販
  → タップで詳細（内容・コース・物販の3カラム）
```

---

## Phase 6-1: カルテ複数メニュー化 + 支払方法 + 予約引き継ぎ

**テスターの最大の混乱ポイントを解消**

### DB変更

**新規: `supabase/migrations/00017_treatment_record_menus.sql`**

```sql
CREATE TABLE treatment_record_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_record_id UUID NOT NULL REFERENCES treatment_records(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES treatment_menus(id) ON DELETE SET NULL,
  menu_name_snapshot TEXT NOT NULL,
  price_snapshot INTEGER,
  duration_minutes_snapshot INTEGER,
  payment_type TEXT NOT NULL DEFAULT 'cash'
    CHECK (payment_type IN ('cash', 'credit', 'ticket', 'service')),
  ticket_id UUID REFERENCES course_tickets(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS + インデックス + 既存データのバックフィル
```

**payment_typeの4値**:
- `cash`: 現金（当日払い — オプション等）
- `credit`: クレジットカード（当日払い）
- `ticket`: 回数券消化（売上計上しない）
- `service`: サービス（0円特典 — 「10回購入で1回無料」等）

**既存の`treatment_records.menu_id`は残す**（後方互換）

### カルテ作成画面のUI

```
━━ 施術メニュー ━━

☑ バストメイクコース 80分
    支払い: [回数券▼]
    → 2回券（残1回）
    → 10回券（残8回）  ← 選択

☑ 腹オプション ¥3,000
    支払い: [現金▼] / [クレジット▼]

合計: 回数券1回消化 + ¥3,000

━━ 施術記録 ━━
[施術部位] [使用化粧品] [施術前の状態]
[施術後メモ] [会話メモ] [注意事項] [次回申し送り]
[写真アップロード]
```

- 予約から遷移時: `appointment_menus`を取得してメニュー自動プリセット
- 回数券消化時: 保有チケット一覧から選択 → `use_course_ticket_session` RPC呼び出し

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `supabase/migrations/00017_treatment_record_menus.sql` | 新規テーブル + RLS + バックフィル |
| `src/types/database.ts` | treatment_record_menus 型追加 |
| `src/app/(dashboard)/records/new/page.tsx` | 複数メニュー選択 + 支払方法 + 回数券選択 + 予約引き継ぎ |
| `src/app/(dashboard)/records/[id]/page.tsx` | 複数メニュー + 支払方法表示 |
| `src/app/(dashboard)/records/[id]/edit/page.tsx` | 複数メニュー + 支払方法編集 |
| `src/app/(dashboard)/customers/[id]/page.tsx` | 施術履歴のメニュー表示更新 |

---

## Phase 6-2: カルテへの物販・回数券購入の統合

**「どこに何を入力すればいいか」の問題を完全解消**

### DB変更

**新規: `supabase/migrations/00018_karte_purchase_links.sql`**

```sql
-- 物販をカルテに紐づけ
ALTER TABLE purchases
  ADD COLUMN treatment_record_id UUID REFERENCES treatment_records(id) ON DELETE SET NULL;
CREATE INDEX idx_purchases_treatment_record_id ON purchases(treatment_record_id);

-- 回数券購入をカルテに紐づけ
ALTER TABLE course_tickets
  ADD COLUMN treatment_record_id UUID REFERENCES treatment_records(id) ON DELETE SET NULL;
CREATE INDEX idx_course_tickets_treatment_record_id ON course_tickets(treatment_record_id);
```

### カルテ作成画面の追加UI

```
━━ 施術メニュー ━━
（Phase 6-1で実装済み）

━━ 施術記録 ━━
（既存フィールド）

━━ 回数券購入（任意）━━        [+ 回数券を販売]
| バストメイク2回券  ¥40,000  [×] |

━━ 物販記録（任意）━━          [+ 商品を追加]
| エラスチン x1  ¥17,280  [×] |
| サプリ x4  ¥7,800  ¥31,200  [×] |
| 合計: ¥48,480 |

[キャンセル]                    [保存する]
```

- 回数券・物販セクションはデフォルト折りたたみ（CollapsibleSection）
- 商品モード（在庫連動）/ 自由入力モードの2モード
- 既存の `/customers/{id}/purchases/new` と `/customers/{id}/tickets/new` は残す

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `supabase/migrations/00018_karte_purchase_links.sql` | purchases + course_tickets に treatment_record_id 追加 |
| `src/types/database.ts` | purchases, course_tickets 型更新 |
| `src/app/(dashboard)/records/new/page.tsx` | 回数券購入 + 物販セクション統合 |
| `src/app/(dashboard)/records/[id]/page.tsx` | 紐づく回数券購入・物販表示 |
| `src/app/(dashboard)/customers/[id]/page.tsx` | カルテ一覧に物販・コース金額を横並び表示 |

---

## Phase 6-3: 売上集計の修正 + 経営指標

**売上二重計上の解消 + テスターの売上管理表に近づける**

### 売上集計RPCの修正

```sql
-- get_monthly_sales_summary を修正
-- 施術売上: treatment_record_menus で payment_type = 'cash' or 'credit' のみ
-- 回数券売上: course_tickets.price（購入時に計上）
-- 物販売上: purchases.total_price（変更なし）
```

### 新規RPC: 未消化分合計（前受金）

```sql
-- get_unearned_revenue(p_salon_id)
-- 全顧客の回数券残回数 × 1回あたり単価 の合計
-- テスターのExcelの「未消化分合計 ¥4,913,000」に相当
```

### ダッシュボード改修

- 売上サマリーに「未消化分合計（前受金）」を追加
- 売上レポートで現金/クレジットの内訳表示

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `supabase/migrations/00019_fix_sales_calculation.sql` | RPC修正 + 新規RPC |
| `src/types/database.ts` | Functions型更新 |
| `src/app/(dashboard)/dashboard/page.tsx` | 未消化分合計の表示追加 |
| `src/app/(dashboard)/sales/page.tsx` | 現金/クレジット内訳、計算ロジック修正 |

---

## Phase 6-4: 顧客詳細ページのUI刷新

**テスター手書きメモ2枚目の実現**

### 顧客詳細のカルテ一覧

```
≪ Aさま ≫  コース合計¥___  物販合計¥___  [編集]

【カルテ内容】
1/28  お胸が…..                          物販 ¥7,800
2/2   どこどこに….
2/20  背中が…..   コース ¥40,000   物販 ¥48,480
  ↓
 (詳細タップで展開)

  2/20
  ┌──────────┬───────────┬──────────────┐
  │  施術内容  │  コース    │   物販        │
  │ 背中が…  │ 2回券     │ サプリ ¥17,280│
  │ 胸 圧タメ │ ¥40,000  │ サプリ¥7,800×4│
  └──────────┴───────────┴──────────────┘
```

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(dashboard)/customers/[id]/page.tsx` | カルテ一覧の横並びUI + 詳細展開 |

---

## 実装優先順位

テスターの回答（⑩「カルテと在庫が見づらい」）を踏まえ:

```
Phase 6-1（最優先）: カルテ複数メニュー + 支払方法 + 回数券消化選択
Phase 6-2（高）    : カルテ画面に物販・回数券購入を統合
Phase 6-4（中）    : 顧客詳細の表示改善
Phase 6-3（低）    : 売上集計修正（テスターは現状のExcelに慣れている）
```

---

## テスター回答ログ

### 回答①: 回数券の種類
- 2回券¥40,000がメイン、キャンペーンで10回券¥180,000
- 金額・回数は変動する

### 回答②: 売上計上タイミング
- 回数券購入時に一括売上（パターンA）
- ※サロンによっては消化時計上（パターンB）もある

### 回答③: オプション
- ベースコース + 追加部位（腹・デコルテ等）
- 回数券で事前購入しているケースと、当日現金払いの2パターン

### 回答④: 複数チケット保有
- 2回券の2回目に次の2回券を購入して継続
- 2回券と10回券を同時保有するケースあり → どちらから消化か選びたい

### 回答⑤: 記録の流れ
- カルテ・売上管理表・在庫表の3シートに分けて記録

### 回答⑥: 体験
- 初回体験 → 気に入ったら回数券購入（会員化）
- 体験金額はキャンペーンで変動

### 回答⑦: サービス
- 10回購入で1回コース無料（11回受けられる）等のキャンペーン
- 0円のチケットのような扱い → `payment_type: 'service'` で対応

### 回答⑧: 残コース + オプション金額
- 「残コース」列 = 残回数（金額ではない）。total_count - used_count で計算（現状通り）
- 隣の金額列（例: 99000）= **追加で支払ったオプション料金の累計合計**
  - 例: 腹¥3,000 × 3回 + デコルテ¥5,000 × 2回 + … = ¥99,000
  - 回数券とは別に当日現金/クレジットで支払うオプション部位の合算
  - → カルテの `treatment_record_menus` で `payment_type = 'cash'|'credit'` のメニューを集計すれば算出可能

### 回答⑨: 支払方法
- 確定申告のカード手数料対策で現金/クレジットを分けている
- → `payment_type` に 'cash' | 'credit' が必要

### 回答⑩: 優先度
- カルテと在庫が見づらい（不満）
- 売上管理はExcelに慣れている（急がない）

---

## 設計上のポイント

- **後方互換性**: `treatment_records.menu_id`は残す。新コードは`treatment_record_menus`を使用
- **パフォーマンス**: ダッシュボードのクエリ数は最小限の追加
- **段階的移行**: Phase 6-1だけで最大の改善効果
- **既存パターン踏襲**: `treatment_record_menus`は`appointment_menus`と同じ構造
- **汎用性**: payment_typeの4値（cash/credit/ticket/service）で他サロンの運用も対応可能
- **回数券の柔軟性**: course_ticketsの自由入力を維持（キャンペーンで価格・回数が変動するため）
