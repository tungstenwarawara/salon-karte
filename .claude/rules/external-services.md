# 外部サービス一元管理

> 更新日: 2026-03-05
> 目的: Claude Code が障害対応・設定変更・プランアップグレードを判断するための一元参照ドキュメント

---

## サービス一覧

### 1. Supabase（DB・認証・ストレージ）

| 項目 | 内容 |
|------|------|
| 用途 | PostgreSQL DB、Auth（ログイン/サインアップ）、Storage（施術写真） |
| 現在のプラン | **Free** |
| 商用化時のプラン | **Pro（$25/月）必須** |
| ダッシュボード | https://supabase.com/dashboard |
| ステータスページ | https://status.supabase.com/ |
| MCP接続 | Claude設定画面から接続済み |
| 環境変数 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| 設定ファイル | `src/lib/supabase/client.ts`, `server.ts`, `admin.ts`, `middleware.ts` |

#### Free プランの制限（商用利用リスク）
- **7日間非アクティブで自動停止**（商用では致命的）
- Storage: 1GB（写真機能を使うと即超過）
- DB: 500MB
- 帯域: 5GB/月
- Edge Functions: 50万回/月
- 商用利用: **利用規約上は可能だが、非アクティブ停止が致命的**

#### Pro 移行トリガー
- テスターが写真機能を使い始めた時点
- または商用リリース前（どちらか早い方）

---

### 2. Vercel（ホスティング・Analytics）

| 項目 | 内容 |
|------|------|
| 用途 | Next.js デプロイ、Analytics、Speed Insights、Cron Jobs |
| 現在のプラン | **Hobby（無料）** |
| 商用化時のプラン | **Pro（$20/月）必須** |
| ダッシュボード | https://vercel.com/dashboard |
| ステータスページ | https://www.vercel-status.com/ |
| MCP接続 | Claude設定画面から接続済み |
| 環境変数 | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL` |

#### Hobby プランの制限（商用利用リスク）
- **商用利用不可**（利用規約: "personal, non-commercial projects only"）
- 帯域: 100GB/月
- Serverless Functions: 100GB-Hours
- Cron Jobs: 1日2回まで（現在 LINE リマインドで使用）
- **商用サービスを Hobby で公開するのは規約違反**

#### Pro 移行トリガー
- **商用リリース前に必須**（規約上の制約）

---

### 3. Stripe（決済）

| 項目 | 内容 |
|------|------|
| 用途 | 月額サブスクリプション（2,980円/月） |
| 現在の状態 | **テストモード** |
| 商用化時の状態 | **本番モード必須** |
| ダッシュボード | https://dashboard.stripe.com |
| 環境変数 | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_ID` |
| 設定ファイル | `src/lib/stripe.ts` |
| API実装 | `src/app/api/stripe/checkout/`, `portal/`, `webhooks/stripe/` |

#### テストモード→本番モードの移行手順
1. Stripe ダッシュボードで本番環境を有効化
2. 本人確認（個人事業主: 身分証明書 + 住所確認）
3. 銀行口座登録（振込先）
4. 本番用の Product + Price を作成
5. 環境変数を本番キーに差し替え
6. Webhook エンドポイントを本番 URL で再登録
7. テスト決済で動作確認

#### 手数料
- クレジットカード: 3.6%
- 2,980円の場合: 107円/決済（手取り2,873円）

---

### 4. Resend（トランザクションメール）

| 項目 | 内容 |
|------|------|
| 用途 | 予約確認メール、リマインド、カウンセリング送信 |
| 現在のプラン | **Free** |
| 商用化時のプラン | **Free で十分（50サロンまで）** |
| ダッシュボード | https://resend.com/overview |
| 環境変数 | `RESEND_API_KEY`, `EMAIL_FROM` |
| 設定ファイル | `src/lib/email/client.ts`, `templates.ts` |

#### Free プランの制限
- 100通/日（3,000通/月）
- 1ドメインのみ
- 商用利用: **可能**
- 1サロンあたり月10-20通 → 50サロンまで Free 枠内

#### オプショナル
- API_KEY 未設定時はメール送信をスキップ（graceful degradation）

---

### 5. Sentry（エラー監視）

| 項目 | 内容 |
|------|------|
| 用途 | 本番環境のエラー追跡、PII自動マスキング |
| 現在のプラン | **Developer（無料）** |
| 商用化時のプラン | **Developer で十分（100サロンまで）** |
| ダッシュボード | https://sentry.io |
| 環境変数 | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` |
| 設定ファイル | `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts` |

#### Developer プランの制限
- 5,000イベント/月
- 1ユーザーのみ
- 30日間データ保持
- 商用利用: **可能**

---

### 6. LINE Messaging API（通知）

| 項目 | 内容 |
|------|------|
| 用途 | 予約確認通知、前日リマインド、友だち管理 |
| コスト負担 | **サロン側**（各サロンが自分のLINE公式アカウントを接続） |
| ダッシュボード | https://developers.line.biz |
| 設定保存先 | `salon_line_configs` テーブル（AES-256暗号化） |
| 設定ファイル | `src/lib/line/api.ts`, `crypto.ts`, `webhook-verify.ts`, `event-handler.ts`, `messages.ts` |
| API実装 | `src/app/api/line/` (6エンドポイント) + `src/app/api/cron/line-reminders/` |

#### サロン側の制限
- LINE公式アカウント（コミュニケーションプラン）: 月200通まで無料
- 1サロンあたり月50-100通 → 無料枠で十分
- salon-karte のインフラコストには影響なし

---

### 7. Google Analytics 4（訪問者分析）

| 項目 | 内容 |
|------|------|
| 用途 | LP訪問者数、ユーザー行動計測 |
| 現在のプラン | **無料** |
| 商用化時のプラン | **無料** |
| 環境変数 | `NEXT_PUBLIC_GA4_ID` |
| 設定ファイル | `src/app/layout.tsx`（条件付きスクリプト埋め込み） |
| 制限 | なし（商用利用制限なし）|

---

## 環境変数一覧

### 必須（本番）
```
NEXT_PUBLIC_SUPABASE_URL          # Supabase プロジェクト URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase 匿名キー
SUPABASE_SERVICE_ROLE_KEY         # Supabase サービスロールキー（Webhook用）
STRIPE_SECRET_KEY                 # Stripe シークレットキー
STRIPE_WEBHOOK_SECRET             # Stripe Webhook 署名検証
NEXT_PUBLIC_STRIPE_PRICE_ID       # Stripe 価格ID（スタンダードプラン）
NEXT_PUBLIC_SENTRY_DSN            # Sentry DSN
SENTRY_ORG                        # Sentry 組織名
SENTRY_PROJECT                    # Sentry プロジェクト名
SENTRY_AUTH_TOKEN                 # Sentry Auth トークン（ソースマップ用）
ENCRYPTION_KEY                    # LINE設定暗号化キー（AES-256）
CRON_SECRET                       # Cron 認証キー
```

### オプション
```
RESEND_API_KEY                    # Resend APIキー（未設定時はメール送信スキップ）
EMAIL_FROM                        # メール送信元アドレス
NEXT_PUBLIC_GA4_ID                # Google Analytics 4 測定ID
NEXT_PUBLIC_APP_URL               # アプリURL（OGP・SEO用）
NEXT_PUBLIC_BASE_URL              # ベースURL（開発用）
```

---

## 障害対応フロー

### ログイン/認証が動かない
1. Supabase ステータス確認: https://status.supabase.com/
2. `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しいか確認
3. Supabase ダッシュボードで Auth ログを確認

### 決済が動かない
1. Stripe ダッシュボード → Webhook → イベントログで最新の配信状態を確認
2. テストモード/本番モードの環境変数が正しいか確認
3. Webhook 署名検証エラー: `STRIPE_WEBHOOK_SECRET` が正しいか確認

### メールが届かない
1. Resend ダッシュボードで送信ログを確認
2. `RESEND_API_KEY` が設定されているか確認（未設定なら送信スキップされる）
3. ドメインの DNS 設定（SPF/DKIM/DMARC）を確認

### LINE通知が届かない
1. `salon_line_configs` テーブルのサロン設定を確認
2. LINE Developers Console でチャネルの有効性を確認
3. Webhook URL が正しく登録されているか確認
4. `ENCRYPTION_KEY` が本番と一致しているか確認

### デプロイが失敗する
1. Vercel ダッシュボード → Deployments でビルドログを確認
2. Sentry でランタイムエラーを確認
3. `npm run build` をローカルで実行してビルドエラーを再現

### エラー監視
1. Sentry ダッシュボードで未解決のイシューを確認
2. PII マスキングが正しく動作しているか確認（顧客名がマスクされているか）

---

## 商用化チェックリスト

- [ ] Vercel Hobby → Pro 移行
- [ ] Supabase Free → Pro 移行
- [ ] Stripe テストモード → 本番モード有効化
- [ ] 環境変数の本番キー設定
- [ ] Webhook エンドポイントの本番 URL 登録
- [ ] ドメイン DNS 設定確認（Resend SPF/DKIM）
