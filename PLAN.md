# サロンカルテ - エステサロン向けシンプルカルテ管理システム

## プロジェクト概要

個人エステサロン向けの「カルテ管理に特化した」超シンプルなWebアプリ。
既存サービス（月額5,500〜21,000円）が抱える「多機能すぎて高い」問題を解決し、
本当に必要な機能だけを月額2,000〜3,000円で提供する。

## ターゲットユーザー

- 個人経営のエステサロンオーナー（1人〜少人数運営）
- 現在、紙カルテやExcelで顧客管理している
- ITリテラシーは高くない（スマホは使えるがPCは苦手な層）
- 予約管理やPOSレジは不要、もしくは別ツールで対応済み

## 競合との差別化

| 項目 | 既存サービス（Bionly, BeSALO等） | サロンカルテ |
|------|-------------------------------|-------------|
| 月額料金 | 5,500〜21,000円 | 2,000〜3,000円 |
| 初期費用 | 0〜30,000円 | 0円 |
| 機能範囲 | カルテ+予約+POS+分析+メール配信 | カルテ管理に特化 |
| 対象規模 | 小〜中規模（多店舗対応あり） | 個人・少人数サロン |
| 操作難易度 | 覚えることが多い | スマホ感覚で即使える |
| 契約縛り | 6ヶ月〜が多い | 1ヶ月単位 |

## 技術スタック

- **フロントエンド**: Next.js (App Router) + TypeScript + Tailwind CSS
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

## MVP機能一覧

### Phase 1: MVP（最小限のリリース）

#### 1. 認証
- サロンオーナーのアカウント登録（メール/パスワード）
- ログイン/ログアウト
- パスワードリセット

#### 2. 顧客管理
- 顧客の新規登録
  - 氏名（カナ）
  - 生年月日
  - 電話番号
  - メールアドレス（任意）
  - 肌質（ドロップダウン: 普通肌/乾燥肌/脂性肌/混合肌/敏感肌）
  - アレルギー・注意事項（フリーテキスト）
  - メモ（フリーテキスト）
- 顧客一覧表示（名前検索・カナ検索対応）
- 顧客情報の編集・削除
- 顧客詳細画面（基本情報+施術履歴一覧）

#### 3. 施術記録（カルテ）
- 施術記録の新規作成
  - 施術日（デフォルト: 今日）
  - 施術メニュー（自由入力 or 事前登録メニューから選択）
  - 施術部位
  - 使用した化粧品・機器（フリーテキスト）
  - 肌の状態メモ（施術前）
  - 施術後の経過メモ
  - 次回への申し送り
- 施術記録一覧（顧客ごとに時系列表示）
- 施術記録の編集・削除

#### 4. 写真管理
- 施術前後の写真アップロード（スマホカメラ直接 or ギャラリーから選択）
- 写真への簡易メモ付与
- ビフォーアフター比較表示（2枚を横並び）

#### 5. 施術メニューマスタ
- サロンで提供する施術メニューの事前登録
  - メニュー名
  - カテゴリ（フェイシャル/ボディ/脱毛/その他）
  - 所要時間（目安）
  - 料金（目安）
- カルテ作成時にメニューマスタから選択可能

### Phase 2: 改善・追加機能（テスター運用後のフィードバックを受けて）

- 次回予約リマインダー（メモベース、通知なし→ありに段階的に）
- カルテのPDF出力（印刷用）
- 顧客の来店頻度・最終来店日の可視化
- カウンセリングシートのデジタル化（初回来店時に顧客自身が入力）
- ダッシュボード（今日の予約メモ一覧、最近のカルテ）

### Phase 3: 将来構想（有料化後）

- LINE通知連携（次回予約リマインド）
- 複数スタッフ対応
- データエクスポート（CSV）
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
  skin_condition_before TEXT,
  notes_after TEXT,
  next_visit_memo TEXT,
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
  module_key TEXT NOT NULL, -- 'photo_expand' / 'counseling_sheet' / 'pdf_export' / 'analytics' / 'line_notify' / 'booking_memo' / 'data_export' / 'multi_staff'
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);
```

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

## 画面構成

```
/                       → ランディングページ（未ログイン時）
/login                  → ログイン画面
/signup                 → アカウント登録画面
/dashboard              → ダッシュボード（ログイン後のホーム）
/customers              → 顧客一覧
/customers/new          → 顧客新規登録
/customers/[id]         → 顧客詳細（基本情報+施術履歴）
/customers/[id]/edit    → 顧客情報編集
/records/new?customer=[id] → 施術記録の新規作成
/records/[id]           → 施術記録詳細（写真含む）
/records/[id]/edit      → 施術記録編集
/settings               → サロン設定
/settings/menus         → 施術メニュー管理
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
1. **カルテ作成**: ダッシュボード → 顧客選択 → 「施術記録を追加」→ 入力 → 保存（3ステップ）
2. **顧客検索**: 顧客一覧 → 検索バーにカナ入力 → タップで詳細表示（2ステップ）
3. **写真登録**: 施術記録作成中 → 「写真を追加」→ カメラ or ギャラリー → 保存（3ステップ）

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
サロンカルテでは基本料金を最小限に抑え、追加機能をオプションモジュールとして
月額上乗せで提供する。サロンの成長に合わせて機能を足していけるので、
オーナーにとってもコスト管理がしやすく、解約理由が生まれにくい。

### 料金テーブル

#### 基本プラン（必須）

| プラン | 月額（税込） | 内容 |
|--------|-------------|------|
| お試し | 0円 | 顧客10件まで、写真なし。導入判断用 |
| 基本プラン | 2,980円 | 顧客数無制限、施術記録、写真保存（5GB） |

#### オプションモジュール（任意追加）

| モジュール | 月額（税込） | 提供時期 | 内容 |
|-----------|-------------|---------|------|
| 写真拡張 | +500円 | Phase 2 | 保存容量20GBに拡張、ビフォーアフター自動並べ替え |
| カウンセリングシート | +500円 | Phase 2 | 初回来店時にお客様自身がスマホで入力できるデジタル問診票 |
| カルテPDF出力 | +300円 | Phase 2 | カルテを印刷用PDFで出力、お客様への施術報告書として |
| 来店分析 | +500円 | Phase 2 | 来店頻度、最終来店日、リピート率の可視化ダッシュボード |
| LINE通知 | +1,000円 | Phase 3 | 次回予約リマインド、施術後フォローメッセージ自動送信 |
| 予約メモ管理 | +300円 | Phase 2 | 次回予約のメモ管理、今日の予約一覧ダッシュボード |
| データエクスポート | +300円 | Phase 3 | 顧客データ・施術記録のCSVエクスポート |
| 複数スタッフ対応 | +1,000円 | Phase 3 | スタッフアカウント追加、権限管理 |

#### 料金シミュレーション例

- **最小構成**: 基本プランのみ → **月2,980円**
  - カルテ管理と写真保存だけで十分な個人サロン向け
- **標準構成**: 基本 + カウンセリングシート + 予約メモ → **月3,780円**
  - 初回問診のデジタル化と予約管理を追加
- **フル構成**: 基本 + 写真拡張 + カウンセリング + LINE通知 + 来店分析 → **月5,480円**
  - 既存サービスのKaruteKun（月5,500円〜）と同等の機能で同価格帯、ただし不要な機能を省ける

### ビジネスモデル上のメリット

1. **低い導入障壁**: 月2,980円スタートなので「試してみよう」のハードルが低い
2. **自然なアップセル**: 使っているうちに「この機能もほしい」が生まれ、ARPU（顧客単価）が自然に上がる
3. **低い解約率**: 自分で選んだ機能だけ払っているので「高い」という不満が生まれにくい
4. **開発の優先順位が明確**: オプションの申込数＝ニーズの強さ。データドリブンで開発できる
5. **顧客の声が直接収益に**: 「こんな機能ほしい」→ 作る → オプション化 → 収益増のサイクル

### 収益シミュレーション

月5.1万円の投資回収ラインに対して:

| シナリオ | 顧客数 | 平均単価 | 月間売上 |
|---------|--------|---------|---------|
| 最小 | 10件 | 2,980円 | 29,800円 |
| 中間 | 15件 | 3,500円 | 52,500円 ✅ 回収ライン突破 |
| 目標 | 20件 | 4,000円 | 80,000円 |

平均単価3,500円の場合、15サロンで投資回収ラインを超える。
施術系サロン（エステ、ネイル、整体、美容室）の市場規模を考えれば現実的な数字。

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
- Phase 1のMVP時点ではオプション機能は未実装でOK、基本プランの完成度を優先

## 全体の優先順位

1. **カルテアプリMVP完成**（Phase 1 / Week 1〜4）
2. **テスター経営者のサロンHP/LP作成**（テスター特典・実績づくり / Week 5）
3. **サロンカルテ自体のLP作成**（新規サロンオーナー獲得用 / Week 6）

## 開発スケジュール（目安）

### Week 1: 基盤構築
- [ ] GitHubリポジトリ作成・初期設定
- [ ] Next.js + Tailwind CSS プロジェクトセットアップ
- [ ] Supabaseプロジェクト作成・DB構築
- [ ] 認証機能（サインアップ/ログイン/ログアウト）
- [ ] サロン初期設定フロー

### Week 2: コア機能
- [ ] 顧客一覧・検索機能
- [ ] 顧客登録・編集・削除
- [ ] 顧客詳細画面
- [ ] 施術メニューマスタ管理

### Week 3: カルテ機能
- [ ] 施術記録の作成・編集・削除
- [ ] 写真アップロード（カメラ/ギャラリー）
- [ ] ビフォーアフター比較表示
- [ ] 顧客詳細画面に施術履歴一覧を統合

### Week 4: 仕上げ・デプロイ
- [ ] ダッシュボード画面
- [ ] レスポンシブ対応の最終調整
- [ ] プライバシーポリシー・利用規約ページ
- [ ] Vercelデプロイ・独自ドメイン設定
- [ ] テスター（知り合いの経営者1名）への提供開始

### Week 5: テスターサロンのHP/LP作成
- [ ] テスターサロンのヒアリング（サロンのコンセプト、メニュー、写真素材等）
- [ ] サロンHP/LPのデザイン・実装
- [ ] 独自ドメイン設定・公開
- [ ] テスターからのフィードバック収集開始

### Week 6: サロンカルテのLP作成
- [ ] サロンカルテ自体の宣伝用LP作成（新規サロンオーナー獲得用）
- [ ] テスターの実績・声の掲載
- [ ] 料金プラン・機能紹介の掲載

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

## ディレクトリ構成（想定）

```
salon-karte/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx          # 顧客一覧
│   │   │   │   ├── new/page.tsx      # 顧客新規登録
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # 顧客詳細
│   │   │   │       └── edit/page.tsx # 顧客編集
│   │   │   ├── records/
│   │   │   │   ├── new/page.tsx      # 施術記録作成
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # 施術記録詳細
│   │   │   │       └── edit/page.tsx # 施術記録編集
│   │   │   └── settings/
│   │   │       ├── page.tsx          # サロン設定
│   │   │       └── menus/page.tsx    # メニュー管理
│   │   ├── layout.tsx
│   │   └── page.tsx                  # ランディングページ
│   ├── components/
│   │   ├── ui/                       # 共通UIコンポーネント
│   │   ├── customers/                # 顧客関連コンポーネント
│   │   ├── records/                  # 施術記録関連コンポーネント
│   │   └── layout/                   # レイアウトコンポーネント
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Supabaseクライアント
│   │   │   ├── server.ts            # サーバーサイドクライアント
│   │   │   └── middleware.ts         # 認証ミドルウェア
│   │   └── utils.ts
│   └── types/
│       └── database.ts               # Supabase型定義
├── public/
├── supabase/
│   └── migrations/                   # DBマイグレーション
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── PLAN.md                           # このファイル
└── README.md
```

## 注意事項・Claude Code向けメモ

- スマホでの操作が最優先。デスクトップは後回しでOK
- 日本語UI。ラベル、プレースホルダー、エラーメッセージすべて日本語
- フォームのバリデーションは日本の電話番号形式に対応
- 写真はSupabase Storageのprivateバケットに保存し、署名付きURLで表示
- 全テーブルにRLSを必ず設定すること（個人情報を扱うため最重要）
- Supabaseの型定義は `npx supabase gen types typescript` で自動生成する
- コンポーネントは可能な限りServer Componentsを使い、クライアントは最小限に
- エラーハンドリングはユーザーフレンドリーなメッセージを日本語で表示
