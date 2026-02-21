# salon-karte — Claude開発ガイド

## プロジェクト概要
個人サロンオーナー向けの電子カルテPWA。
**ターゲット**: ITリテラシーが高くない個人サロンオーナー（1人運営）。スマホメイン。
**技術スタック**: Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + Supabase

## コマンド
```bash
npx next build    # ビルド検証
npm run dev       # 開発サーバー
npm run lint      # ESLint
```

## ブランチ戦略
- `main`: 本番（Vercel自動デプロイ → salon-karte.vercel.app）
- 機能開発: `claude/` プレフィックスのワークツリー → PR → main にマージ

## コーディング規約
- 日本語UI（ラベル・プレースホルダー・エラーメッセージ・コメント全て日本語）
- Tailwind CSS 4 カスタムカラー: `bg-accent`, `text-text-light`, `border-border` 等
- コンポーネントは `src/components/`、ページは `src/app/(dashboard)/` 配下
- Supabaseクライアント: ページ内で `createClient()` 直接使用（Server Componentはserver版）
- 型定義は `src/types/database.ts` に集約（唯一の真実）

## ファイル構成
```
src/
├── app/
│   ├── (auth)/              # login, signup, reset-password, update-password, setup
│   ├── (dashboard)/         # 認証必須（layout.tsxでヘッダー表示）
│   │   ├── dashboard/       # ダッシュボード
│   │   ├── customers/       # 顧客: 一覧, 詳細, 編集, 新規, 物販新規, 回数券新規
│   │   ├── appointments/    # 予約: 一覧(日別), 新規, 編集
│   │   ├── records/         # カルテ: 新規, 詳細, 編集
│   │   ├── sales/           # 売上グラフ
│   │   │   └── inventory/   # 在庫: ダッシュボード, 商品管理, 仕入, 消費, 棚卸, 確定申告
│   │   ├── settings/        # サロン情報, 営業時間, 不定休, メニュー管理, CSVインポート
│   │   └── guide/           # 使い方ガイド
│   ├── auth/callback/       # OAuth/マジックリンクコールバック
│   ├── privacy/ & terms/    # 静的ページ
├── components/
│   ├── layout/              # DashboardHeader, PageHeader
│   ├── ui/                  # Toast, ErrorAlert, CollapsibleSection, AutoResizeTextarea
│   ├── dashboard/           # SummaryCards, TodayAppointments, RecentRecords, etc.
│   ├── customers/           # CourseTicketSection, CustomerBasicInfo, VisitAnalytics, etc.
│   ├── records/             # PhotoUpload, BeforeAfterComparison, MenuSelector, PaymentSection, etc.
│   ├── appointments/        # AppointmentMenuSelector, TimePicker, TimeSlotVisualization, etc.
│   ├── import/              # CsvUploadStep, CsvPreviewTable, etc.
│   └── inventory/           # ManagementTabs
├── lib/
│   ├── supabase/            # client.ts, server.ts, middleware.ts, auth-helpers.ts, storage.ts
│   ├── hooks/               # use-form-draft.ts
│   ├── csv-parse.ts         # CSVパーサー
│   ├── business-hours.ts
│   └── format.ts
└── types/database.ts
```

## 品質ルール（分野別）
`.claude/rules/` に分野別ガードレールを配置:
- **planning.md** — 設計判断、機能追加ゲート、教訓ログ
- **uiux.md** — ファイルサイズ制限、レスポンシブ、品質ギャップ一覧
- **security.md** — マルチテナント分離、RLS、認証、バリデーション
- **performance.md** — クエリ最適化、並列化、ダッシュボード基準
- **database.md** — スキーマ参照、マイグレーション管理（DB作業時のみロード）

## マージ前チェックリスト
1. **ビルド**: `npx next build` → エラーゼロ
2. **DB整合性**: `list_tables` / `list_migrations` がローカルと一致（→ database.md）
3. **セキュリティ**: `get_advisors(type: "security")` に新規警告なし（→ security.md）
4. **パフォーマンス**: `select('*')` なし、クエリ並列化（→ performance.md）
5. **UIUX**: 375pxで表示崩れなし、タッチ48px以上（→ uiux.md）
6. **ルート整合性**: `dashboard-header.tsx` のリンクが全て実在ページを指している
