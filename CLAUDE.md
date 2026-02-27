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

## プッシュ後の業務テスト（必須）
コミット＆プッシュ完了後、Claude Preview MCP で業務テストを実施する。

### テストサロン（必須）
- **業務テストには必ずテストサロンアカウントを使用する**
- **本番アカウントでのテスト禁止**（実オーナーのデータは個人情報）
- 詳細: `.claude/rules/test-salon.md` を参照

### 手順
1. `preview_start(name: "dev")` でdev server起動（起動済みなら不要）
2. テストサロンでログイン（`.claude/rules/test-salon.md` の認証情報を使用）
3. `git diff` で変更ファイルを特定し、テスト選定ガイド（`.claude/tests/test-case-master.md`）に従いテスト対象フローを決定
4. 対象フローの `[AUTO]` テストケースを `preview_snapshot` / `preview_click` / `preview_fill` / `preview_eval` で実行
5. 全テスト結果をユーザーに報告（✅PASS / ❌FAIL / ⚠️WARN）
6. ❌FAIL がある場合はその場で修正→再テスト→再コミット＆プッシュ

### テスト範囲の決定ルール
- **src/components/customers/**, **src/app/**/customers/** 変更** → フロー1（顧客管理）
- **src/components/appointments/**, **src/app/**/appointments/** 変更** → フロー2（予約管理）
- **src/components/records/**, **src/app/**/records/** 変更** → フロー3（カルテ管理）
- **src/components/inventory/**, **src/app/**/sales/inventory/** 変更** → フロー4（物販・在庫）
- **回数券関連** → フロー5
- **src/components/settings/**, **src/app/**/settings/** 変更** → フロー6-8（該当セクション）
- **src/components/dashboard/**, **src/app/**/dashboard/** 変更** → フロー10
- **src/lib/** のみ変更 → ユニットテスト（npm test）で十分、業務テスト不要
- **CLAUDE.md、.claude/rules/、docs のみ** → 業務テスト不要
- **複数領域にまたがる変更** → 該当する全フロー + フロー10（ダッシュボード）

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
