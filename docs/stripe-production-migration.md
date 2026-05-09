# Stripe 本番化 実行手順

> 作成日: 2026-05-08
> 目的: テストモード → 本番モードへの移行を「待ち時間」を含めて段取りする
> 前提: テストモード実装はすでに完了（checkout / portal / webhook / 紹介特典 すべて稼働確認済み）

---

## 全体像とタイムライン

| フェーズ | 担当 | 所要時間 | 並行可能か |
|---|---|---|---|
| 1. Stripe アカウント本人確認・銀行口座登録 | **オーナー手動** | 申請〜数時間〜最大3営業日（Stripe側審査） | ◯（Claude は別作業可） |
| 2. 本番 Product + Price の作成 | **オーナー手動** | 5分 | × 本人確認後 |
| 3. 本番 API キー取得 + `.env.local` 更新（ローカル検証用） | **オーナー手動 + Claude** | 5分 | × 本人確認後 |
| 4. ローカルで本番モード動作確認 | **Claude** | 10分 | × Step 3 後 |
| 5. Vercel 環境変数の本番キー設定 | **オーナー手動** | 10分 | × Step 4 後 |
| 6. 本番 URL で Webhook エンドポイント登録 | **オーナー手動** | 5分 | × Step 5 後 |
| 7. 本番デプロイ + スモーク決済（実カード→即リファンド） | **オーナー + Claude** | 15分 | 最終 |

**ポイント**: Step 1（本人確認）はオーナー側の待ち時間が発生するため、最初に着手して Claude は並行で E2E 補強を進めます。

---

## Phase 1: Stripe アカウント本人確認・銀行口座登録（オーナー手動）

### やること

1. https://dashboard.stripe.com にログイン
2. 左上の環境スイッチが「**テスト**」になっていることを確認
3. 右上の **「本番環境を有効化」** または **「Activate」** をクリック
4. 事業者情報を入力:
   - **事業形態**: 個人事業主
   - **屋号**: Mikkabouzu Lab（開業届の屋号と一致させる）
   - **業種**: ソフトウェア / SaaS（サブスクリプション）
   - **商品・サービス内容**: 「個人サロン向け顧客管理・カルテ・予約サービスの月額提供」
   - **平均取引額**: 2,980円
   - **取引頻度**: 月次サブスクリプション
5. 個人情報・本人確認書類:
   - 氏名・生年月日・住所
   - **本人確認書類**: 運転免許証 or マイナンバーカード（表裏）の写真
6. 銀行口座登録:
   - 振込先口座（事業用がベター。個人口座でも可）
   - 銀行名・支店名・口座番号
7. 申請を送信

### Stripe 側の審査

- 通常: 数時間〜1営業日で完了
- 追加書類要求: 開業届のコピー等を求められる場合あり（メールで通知される）
- 完了通知: 登録メールに「本番環境が有効になりました」というメールが届く

### 待ち時間中に Claude が進める作業（並行）

- Stripe checkout フローの E2E（テストモードで成約導線を保証）
- パスワードリセットフローの E2E
- モバイル（iPhone）プロジェクトでの活性化テスト再走

---

## Phase 2: 本番 Product + Price の作成（オーナー手動・所要5分）

> 前提: Phase 1 の本人確認が完了し、本番環境に切り替え可能になっていること

1. Stripe ダッシュボードの環境スイッチを **「本番」** に切り替え（左上）
2. 左メニュー **「商品カタログ」** → **「+ 商品を追加」**
3. 商品情報入力:
   - **名前**: スタンダードプラン
   - **説明**: salon-karte 月額サブスクリプション
4. 価格情報:
   - **モデル**: 標準価格設定
   - **価格**: 2,980円
   - **通貨**: JPY
   - **請求期間**: 月次（毎月）
5. 「商品を保存」
6. 作成された Price の **price_id** をコピー（例: `price_1ABC...`）
   - これを Phase 3 で `NEXT_PUBLIC_STRIPE_PRICE_ID` に設定

### 重要: テスト用 Product と本番 Product は別物

テストモードで作った `price_xxx` は本番では使えません。本番モードに切り替えてから新規作成してください。

---

## Phase 3: 本番 API キー取得 + ローカル検証用に `.env.local` を準備

### Stripe ダッシュボードでキー取得

1. 環境スイッチを「**本番**」に切り替え
2. 左メニュー **「開発者」** → **「APIキー」**
3. **「Secret key」** を **「Reveal live key token」** で表示してコピー
   - 形式: `sk_live_...`
   - ⚠️ このキーは絶対にコミット・共有しないこと

### `.env.local` の更新（ローカル動作確認用）

現在のテスト用キーは一度コメントアウトして、本番キーをコピー貼付けします:

```bash
# テストモード（一時的にコメントアウト）
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_test_...
# NEXT_PUBLIC_STRIPE_PRICE_ID=price_test_...

# 本番モード（Phase 2-3 で取得した値）
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_本番のID
# STRIPE_WEBHOOK_SECRET は Phase 6 で本番 Webhook 登録後に取得・設定
```

> 注: ローカル検証では Webhook 受信できないので `STRIPE_WEBHOOK_SECRET` は一時的に空でOK。決済ボタンが本番モードで動くかだけを確認します。

---

## Phase 4: ローカルで本番モード動作確認（Claude）

Claude が以下を実行して、本番キーで checkout が動くことを確認:

```bash
# 1. dev server 再起動（env変更を反映）
npm run dev

# 2. テストサロンでログイン → /settings/billing へアクセス
# 3. 「スタンダードプランにアップグレード」ボタン押下
# 4. Stripe Checkout が開くことを確認
#    - URL が checkout.stripe.com で始まる
#    - 「テストモード」のリボンが表示されない（本番モード）
#    - 価格が ¥2,980 と表示される
# 5. キャンセルしてダッシュボードに戻る
```

**この時点で課金は発生しません**（実際にカード番号を入れるまで）。

---

## Phase 5: Vercel 環境変数の本番キー設定（オーナー手動）

1. https://vercel.com/dashboard で salon-karte プロジェクトを開く
2. **Settings** → **Environment Variables**
3. 以下を **Production** スコープで設定（既存のテストキーは Edit で上書き）:

| 変数名 | 値 |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...`（Phase 3 で取得） |
| `NEXT_PUBLIC_STRIPE_PRICE_ID` | `price_本番のID`（Phase 2 で作成） |
| `STRIPE_WEBHOOK_SECRET` | （Phase 6 で取得後にここに戻る） |

4. **Preview** や **Development** スコープにテストキーを残しておくのが安全（プレビューデプロイで本番課金しない）

---

## Phase 6: 本番 URL で Webhook エンドポイント登録（オーナー手動）

1. Stripe ダッシュボード（**本番モード**）→ **開発者** → **Webhooks**
2. **「エンドポイントを追加」**
3. 設定:
   - **エンドポイント URL**: `https://<本番ドメイン>/api/webhooks/stripe`
     - 例: `https://salonkarte.com/api/webhooks/stripe`（独自ドメインの場合）
     - `*.vercel.app` URL を使う場合は最終本番ドメインに変更後に再登録すること
   - **イベント選択**: 以下4つを選ぶ
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.paid`
4. 作成後、エンドポイント詳細画面で **「署名シークレット」** を表示・コピー
   - 形式: `whsec_...`
5. これを Vercel の `STRIPE_WEBHOOK_SECRET` 環境変数に設定（Phase 5 で空にしていた箇所）
6. 設定後 **本番環境を再デプロイ**（Vercel ダッシュボードの「Redeploy」）

### 既存の Webhook イベント

route.ts ([src/app/api/webhooks/stripe/route.ts](../src/app/api/webhooks/stripe/route.ts)) で処理しているイベント:

- `checkout.session.completed` — 初回成約 → サブスクリプション作成 + plan_type=standard
- `customer.subscription.updated` — 更新ステータス反映
- `customer.subscription.deleted` — 解約 → plan_type=free に戻す
- `invoice.payment_failed` — 支払失敗 → status=past_due
- `invoice.paid` — 紹介者特典クレジット付与（被紹介者の初回有料請求時）

---

## Phase 7: 本番デプロイ + スモーク決済

### 1. 本番デプロイ

Vercel が main ブランチへの push で自動デプロイします（または手動 Redeploy）。デプロイ完了を確認。

### 2. オーナー自身のアカウントで実カード決済

> ⚠️ **必ず即リファンドする** — 検証目的なので売上に計上しない

1. オーナー本人の本番アカウントで `/settings/billing` を開く
2. 「スタンダードプランにアップグレード」をクリック
3. **実カード番号**で決済
4. 成功後、`/settings/billing` で「スタンダードプラン」表示になることを確認
5. Stripe ダッシュボード（本番）→ 顧客 → 該当決済を開く
6. **「返金」** をクリック → 全額リファンド
7. salon-karte 側で `/settings/billing` から **「ご利用プランの管理」**（Stripe Customer Portal）→ サブスクリプションキャンセル

### 3. 確認項目

| 確認項目 | 確認場所 |
|---|---|
| Stripe Checkout 画面が「テストモード」表示なしで開くか | ブラウザ |
| 決済後 `subscriptions` テーブルにレコードが入るか | Supabase ダッシュボード |
| `salons.plan_type` が `standard` に変わるか | Supabase ダッシュボード |
| Webhook イベントが200で受信されているか | Stripe ダッシュボード → Webhooks → イベントログ |
| Customer Portal が開けるか | `/settings/billing` の「ご利用プランの管理」 |
| 解約後に `plan_type=free` に戻るか | Supabase ダッシュボード |

---

## ロールバック手順（万が一）

Stripe 本番化後に深刻な問題が発生した場合:

1. **即座にやること**: Vercel の環境変数で `STRIPE_SECRET_KEY` をテストキーに戻す（Phase 5 で残していたもの）→ Redeploy
2. **既に本番決済が走った顧客がいる場合**: Stripe ダッシュボードから手動リファンド
3. **subscriptions テーブルの不整合**: SupabaseでステータスをCanceledに手動更新 + salons.plan_type=free
4. 原因調査・修正後に再デプロイ

> 紹介特典のクレジット付与は本番でも自動実行される。誤付与した場合は Stripe ダッシュボードの Customer Balance を手動修正可能。

---

## チェックリスト（オーナー用・印刷推奨）

### 着手前（Phase 1 直前）
- [ ] 開業届のコピーを手元に用意（追加書類要求時用）
- [ ] 本人確認書類（運転免許証 or マイナンバーカード）の表裏写真を用意
- [ ] 振込先銀行口座情報を用意

### 完了確認
- [ ] Phase 1: Stripe 本人確認 完了通知メール受信
- [ ] Phase 2: 本番 Product + Price 作成、`price_xxx` メモ済み
- [ ] Phase 3: ローカル `.env.local` を本番キーに更新
- [ ] Phase 4: ローカルで Checkout 画面が本番モードで開くことを確認
- [ ] Phase 5: Vercel 環境変数を本番キーに設定
- [ ] Phase 6: 本番 Webhook エンドポイント登録 + 署名シークレット設定
- [ ] Phase 7: 実カードで成約 → リファンド → 解約まで一周動作確認

---

## 関連ファイル

- [src/lib/stripe.ts](../src/lib/stripe.ts) — Stripe SDK 初期化
- [src/app/api/stripe/checkout/route.ts](../src/app/api/stripe/checkout/route.ts) — 成約セッション作成（紹介特典30日無料含む）
- [src/app/api/stripe/portal/route.ts](../src/app/api/stripe/portal/route.ts) — Customer Portal セッション作成
- [src/app/api/webhooks/stripe/route.ts](../src/app/api/webhooks/stripe/route.ts) — Webhook イベントハンドラ（5イベント処理 + 冪等性）
- [src/app/(dashboard)/settings/billing/page.tsx](../src/app/(dashboard)/settings/billing/page.tsx) — オーナー向け課金管理画面
- [src/lib/plan.ts](../src/lib/plan.ts) — プラン定義・制限値
- [supabase/migrations/00055_add_plan_type_and_subscriptions.sql](../supabase/migrations/00055_add_plan_type_and_subscriptions.sql) — subscriptions テーブル
- [supabase/migrations/00059_stripe_processed_events.sql](../supabase/migrations/00059_stripe_processed_events.sql) — Webhook 冪等性管理
- [.claude/rules/external-services.md](../.claude/rules/external-services.md) — 外部サービス全般のルール
