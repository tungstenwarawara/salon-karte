# salon-karte

個人サロン向け顧客管理・カルテ・予約アプリ（Next.js + Supabase）

> **現フェーズ**: Phase 1 集中検証ウィンドウ（2026-04-24〜05-08、2週間）。新機能開発を停止し、既存テスター経由の紹介で有料成約を検証する。判断記録・撤退基準は `docs/commercial-launch-roadmap.md` の「Phase 1 集中検証ウィンドウ」セクション参照。

## 技術スタック
- Next.js 15 (App Router) / React 19 / TypeScript 5.9
- Supabase (Auth + PostgreSQL + Storage)
- Stripe (サブスクリプション決済)
- Resend (トランザクションメール)
- LINE Messaging API (予約通知・リマインド)
- Sentry (エラー監視)
- Tailwind CSS 4
- Vercel デプロイ + Analytics + Speed Insights
- Google Analytics 4

## コマンド
- `npm run dev` — 開発サーバー
- `npm run build` — 本番ビルド
- `npx tsc --noEmit` — 型チェック
- `npm run lint` — ESLint
- `npm test` — ユニットテスト実行（Vitest）
- `npm run test:watch` — テスト監視モード
- `npm run test:coverage` — カバレッジ付きテスト
- `python3 scripts/check-select-columns.py` — カラム名照合（コミット前必須）
- `npx tsx scripts/seed-test-data.ts` — テストデータ投入（初回）
- `npx tsx scripts/seed-test-data.ts --reset` — テストデータリセット

## コミット前チェック（必須）
1. `npx tsc --noEmit` パス
2. `npm test` パス
3. `npm run build` パス
4. `python3 scripts/check-select-columns.py` パス（カラム名 + salon_idフィルタ）

## コミットメッセージ規約
- `feat:` 新機能 / `fix:` バグ修正 / `refactor:` リファクタ / `docs:` ドキュメント
- 日本語で記述
- Co-Authored-By 行を付与

## ドキュメント同期ルール（必須）
機能追加・DB変更時に `docs/` の計画ドキュメントも更新すること。
- `docs/competitive-analysis-and-plan.md` — 実装済み機能一覧・ロードマップ
- `docs/pricing-plan-spec.md` — 料金プラン・Stripe連携の実装状況
- **SessionStart hook** が起動時に docs/ の最終更新日を表示。7日以上古い場合は警告
- **PreToolUse hook** が git commit 時にマイグレーション/プラン変更があれば docs/ 更新を促す

## コミット後の検証（3段階）
変更の種類に応じてテストレベルを選択する。**毎回フルE2Eは不要。**

### レベル1: ビルド検証のみ（最小）
- **対象**: CSS/デザイン変更、コンポーネントのスタイル修正、ドキュメント変更、`src/lib/` のみの変更
- **手順**: `npx tsc --noEmit` → `npm test` → `npm run build` → コミット
- **E2E不要** — preview_screenshot でUI確認するだけで十分

### レベル2: スポット検証（中）
- **対象**: 特定ページのロジック変更、フォーム修正、データ表示変更
- **手順**: ビルド検証 + 該当ページのみ preview_snapshot / preview_click で動作確認
- ログイン → 該当ページ遷移 → 基本操作確認で完了

### レベル3: フルフロー検証（最大）
- **対象**: DB変更（マイグレーション）、認証フロー変更、複数領域にまたがるロジック変更
- **手順**: テスト選定ガイド（`.claude/tests/test-case-master.md`）に従いフル実施

### テストサロン（レベル2・3で必須）
- **業務テストには必ずテストサロンアカウントを使用する**
- **本番アカウントでのテスト禁止**（実オーナーのデータは個人情報）
- 詳細: `.claude/rules/test-salon.md` を参照

### レベル判定の早見表
| 変更内容 | レベル |
|---------|-------|
| CSS / Tailwindクラス / スタイルのみ | 1 |
| globals.css / カラーパレット変更 | 1 |
| コンポーネントのUI調整（ロジック変更なし） | 1 |
| SVG / イラスト / アニメーション追加 | 1 |
| CLAUDE.md / .claude/rules/ / docs のみ | 1（ビルド不要） |
| `src/lib/` のユーティリティ変更 | 1 |
| 特定ページのフォームロジック変更 | 2 |
| データ取得・表示の変更 | 2 |
| 新規ページ追加 | 2 |
| DBマイグレーション | 3 |
| 認証・ミドルウェア変更 | 3 |
| RPC関数の変更 | 3 |
| 複数領域にまたがるロジック変更 | 3 |

## ディレクトリ構成
- `src/app/(dashboard)/` — 管理画面ページ（App Router）
- `src/app/(booking)/` — Web予約ページ（公開）
- `src/app/(public)/` — カウンセリング回答ページ（公開）
- `src/app/api/` — API エンドポイント（Stripe / LINE / Booking / Cron）
- `src/components/` — 共有コンポーネント
- `src/components/lp/` — LP専用コンポーネント
- `src/lib/` — ユーティリティ・Supabase クライアント
- `src/lib/email/` — Resend メール送信
- `src/lib/line/` — LINE API・暗号化・Webhook
- `src/lib/stripe.ts` — Stripe クライアント
- `src/lib/plan.ts` — プラン定義・制限チェック
- `src/lib/__tests__/` — ユニットテスト（Vitest）
- `src/types/database.ts` — DB型定義（唯一の真実）
- `supabase/migrations/` — マイグレーションSQL
- `scripts/` — チェックスクリプト
- `docs/` — 計画ドキュメント（実装状況と同期必須）

## ルール詳細

### 常時読み込み（設計・業務の根幹）
- @.claude/rules/planning.md — 設計哲学・セッション運用
- @.claude/rules/uiux.md — UI/UX品質基準（レビュー観点含む）
- @.claude/rules/security.md — セキュリティ・マルチテナント
- @.claude/rules/lessons-learned.md — 過去の障害・教訓

### 必要時に Read するリファレンス（context節約のため auto-load しない）
- `.claude/rules/database.md` — DB変更・マイグレーション時
- `.claude/rules/performance.md` — パフォーマンス調整時
- `.claude/rules/test-salon.md` — E2E / レベル2・3テスト時
- `.claude/rules/external-services.md` — 外部サービス障害対応・プラン変更時
- `.claude/rules/blog-content.md` — ブログ記事制作時
- `.claude/rules/lp-design.md` — LP改修時
- `.claude/rules/sellability.md` — LP/サインアップ/価格訴求レビュー時
