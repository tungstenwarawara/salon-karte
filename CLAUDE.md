# salon-karte

個人サロン向け顧客管理・カルテ・予約アプリ（Next.js + Supabase）

## 技術スタック
- Next.js 15 (App Router) / React 19 / TypeScript 5.9
- Supabase (Auth + PostgreSQL + Storage + Edge Functions)
- Tailwind CSS 4
- Vercel デプロイ

## コマンド
- `npm run dev` — 開発サーバー
- `npm run build` — 本番ビルド
- `npx tsc --noEmit` — 型チェック
- `npm run lint` — ESLint
- `npm test` — ユニットテスト実行（Vitest）
- `npm run test:watch` — テスト監視モード
- `npm run test:coverage` — カバレッジ付きテスト
- `python3 scripts/check-select-columns.sh` — カラム名照合（コミット前必須）
- `npx tsx scripts/seed-test-data.ts` — テストデータ投入（初回）
- `npx tsx scripts/seed-test-data.ts --reset` — テストデータリセット

## コミット前チェック（必須）
1. `npx tsc --noEmit` パス
2. `npm test` パス
3. `npm run build` パス
4. `python3 scripts/check-select-columns.sh` パス（カラム名 + salon_idフィルタ）

## コミットメッセージ規約
- `feat:` 新機能 / `fix:` バグ修正 / `refactor:` リファクタ / `docs:` ドキュメント
- 日本語で記述
- Co-Authored-By 行を付与

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
- `src/app/(dashboard)/` — 各ページ（App Router）
- `src/components/` — 共有コンポーネント
- `src/lib/` — ユーティリティ・Supabase クライアント
- `src/lib/__tests__/` — ユニットテスト（Vitest）
- `src/types/database.ts` — DB型定義（唯一の真実）
- `supabase/migrations/` — マイグレーションSQL
- `scripts/` — チェックスクリプト

## ルール詳細
プロジェクト固有ルールは `.claude/rules/` を参照:
- @.claude/rules/planning.md — 設計哲学・セッション運用
- @.claude/rules/uiux.md — UI/UX品質基準
- @.claude/rules/security.md — セキュリティ・マルチテナント
- @.claude/rules/database.md — スキーマ・マイグレーション
- @.claude/rules/performance.md — パフォーマンス最適化
- @.claude/rules/lessons-learned.md — 過去の障害・教訓
- @.claude/rules/test-salon.md — テストサロン運用ルール
