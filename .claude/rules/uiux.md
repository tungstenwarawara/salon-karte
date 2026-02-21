# UI/UX 品質ルール

## ターゲットユーザー
ITリテラシーが高くない個人サロンオーナー（1人運営）。スマホメイン。全UI日本語。

## ファイルサイズ制限（厳守）
- ページファイル: 最大300行。超えたらコンポーネント分割必須
- コンポーネント: 最大200行。超えたら責務分割

## レスポンシブデザイン
- 最小幅: 320px
- 主要テスト幅: 375px（iPhone SE）
- 320px〜428pxでレイアウト崩れなし

## タッチ・インタラクション
- 全タッチターゲット: 最小48px
- フォーム送信中: disabled + ローディング表示（二重送信防止）
- 成功フィードバック: `router.push()` 後にToast
- エラーフィードバック: `ErrorAlert` コンポーネント

## ページ新規作成チェックリスト
- `loading.tsx` スケルトンを追加
- パンくずを `<PageHeader>` に設定
- エラーハンドリング（`ErrorAlert` 使用）
- 空状態のUI（データゼロ時の案内表示 + 作成ボタン）
- 二重送信防止（フォームがある場合）
- `router.push()` 後の成功Toast

## コンポーネント変更チェックリスト
- 影響範囲の確認（そのコンポーネントを使用している全ページ）
- レスポンシブ確認（最小幅320px）
- タッチターゲット >= 48px

## スタイリング規約
- Tailwind CSS 4 カスタムカラー: `bg-accent`, `text-text-light`, `border-border`, `bg-surface`, `bg-background`
- 日本語: ラベル・プレースホルダー・エラーメッセージ・コードコメント全て日本語

## 品質ギャップ（2026-02-21 実測 — リファクタリング後）

### ページ（基準: 300行以下）— 残存違反
| ファイル | 行数 |
|---------|-----:|
| `guide/page.tsx` | 645 |
| `sales/page.tsx` | 491 |
| `appointments/new/page.tsx` | 434 |
| `appointments/[id]/edit/page.tsx` | 424 |
| `records/new/page.tsx` | 409 |
| `records/[id]/edit/page.tsx` | 406 |
| `settings/holidays/page.tsx` | 402 |

### 改善済み
- `dashboard/page.tsx` 228行（セクションコンポーネント化完了）
- `customers/[id]/page.tsx` 162行（セクションコンポーネント化完了）
