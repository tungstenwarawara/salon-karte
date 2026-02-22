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
- `python3 scripts/check-select-columns.sh` — カラム名照合（コミット前必須）

## コミット前チェック（必須）
1. `npx tsc --noEmit` パス
2. `npm run build` パス
3. `python3 scripts/check-select-columns.sh` パス（カラム名 + salon_idフィルタ）

## コミットメッセージ規約
- `feat:` 新機能 / `fix:` バグ修正 / `refactor:` リファクタ / `docs:` ドキュメント
- 日本語で記述
- Co-Authored-By 行を付与

## ディレクトリ構成
- `src/app/(dashboard)/` — 各ページ（App Router）
- `src/components/` — 共有コンポーネント
- `src/lib/` — ユーティリティ・Supabase クライアント
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
