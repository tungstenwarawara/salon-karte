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

## ナビゲーションルール（厳守）
- 全サブページに `<PageHeader breadcrumbs={[...]}/>` を設定
- `backLabel` / `backHref` は**廃止済み**（PageHeaderから削除済み）
- フォームページの「戻る」は フォーム内の `キャンセル` ボタン（`router.back()`）で提供
- 詳細ページの「戻る」は パンくずリンクで提供

## ページ新規作成チェックリスト
- `loading.tsx` スケルトンを追加
- パンくずを `<PageHeader breadcrumbs>` に設定（backLabel禁止）
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

## ボタン表記の統一ルール（厳守）

| 種類 | パターン | 例 |
|------|---------|-----|
| 一覧ヘッダーボタン | `+ ○○を登録` | `+ 顧客を登録`, `+ 予約を登録` |
| フォーム送信ボタン（新規・編集共通） | `保存する` / `保存中...` | |
| 空状態CTA | `最初の○○を登録する →` | `最初のカルテを登録する →` |
| インライン追加ボタン | `+ 追加` | `+ メニューを追加` |
| インライン保存 | `保存` / `保存中...` | |
| インライン一覧の送信（追加/更新） | `追加する` / `更新する` | 商品マスタ、メニュー管理 |

- 動詞の混在（「追加」「作成」「記録」「登録」）は禁止
- 新規も編集も送信ボタンは `保存する` に統一（ページタイトルで区別可能）

## リスト型セクションの統一パターン（厳守）

顧客詳細ページの施術履歴・物販・回数券・カウンセリング等、一覧+CRUDを持つセクションは
以下のパターンに**必ず**従う。新規セクション追加・既存修正時に照合すること。

### セクション外枠
- 外枠カードラッパーは**使わない**（`bg-surface rounded-2xl` で包まない）
- 個別アイテムがそれぞれカードになる

### ヘッダー
```tsx
<div className="flex items-center justify-between mb-3">
  <h3 className="font-bold">セクション名</h3>
  <Link|button className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[44px] flex items-center">
    + アクション名
  </Link|button>
</div>
```
- 見出し: `font-bold`（`text-sm` は付けない）
- マージン: `mb-3`（`mb-2` は不可）
- アクションボタン: `min-h-[44px]`（`min-h-[40px]` は不可）

### 個別アイテムカード
```tsx
<div className="bg-surface border border-border rounded-xl p-3 space-y-2">
```
- 必須: `bg-surface`（背景色なしは不可）
- 角丸: `rounded-xl`（`rounded-lg` は不可）
- パディング: `p-3`

### 空状態
```tsx
<div className="bg-surface border border-border rounded-xl p-6 text-center">
  <p className="text-text-light text-sm">〇〇はまだありません</p>
  <Link className="inline-block mt-2 text-sm text-accent hover:underline font-medium">
    最初の〇〇を登録する →
  </Link>
</div>
```

### もっと見るボタン
```tsx
<button className="w-full text-center text-sm text-accent py-2 min-h-[44px]">
  もっと見る（残りX件） / 閉じる
</button>
```

### 削除確認パネル
```tsx
<div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
```

### インライン編集エリア
```tsx
<div className="bg-background rounded-xl p-3 space-y-3">
```

### アクションボタン（編集・削除）
- 編集: `text-xs text-accent px-2 py-1.5 rounded-lg hover:bg-accent/5 min-h-[44px]`
- 削除: `text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px]`

### カード型情報セクション（来店分析・売上サマリー・基本情報等）
- 外枠: `bg-surface border border-border rounded-2xl p-5 space-y-3`
- 見出し: `font-bold text-sm text-text-light`
- リスト型セクションとは明確に区別する

## 品質ギャップ確認（実測コマンド方式）

静的な行数表は陳腐化するため記載しない。以下のコマンドで毎セッション実測すること。

### ページ行数チェック（基準: 300行以下）
```bash
wc -l src/app/\(dashboard\)/*/page.tsx src/app/\(dashboard\)/*/*/page.tsx src/app/\(dashboard\)/*/*/*/page.tsx src/app/\(dashboard\)/*/*/*/*/page.tsx 2>/dev/null | sort -rn | head -20
```

### コンポーネント行数チェック（基準: 200行以下）
```bash
wc -l src/components/**/*.tsx 2>/dev/null | sort -rn | head -20
```

### 違反ファイルのみ抽出
```bash
# ページ: 300行超え
wc -l src/app/\(dashboard\)/*/page.tsx src/app/\(dashboard\)/*/*/page.tsx src/app/\(dashboard\)/*/*/*/page.tsx src/app/\(dashboard\)/*/*/*/*/page.tsx 2>/dev/null | awk '$1 > 300 && !/total/' | sort -rn

# コンポーネント: 200行超え
wc -l src/components/**/*.tsx 2>/dev/null | awk '$1 > 200 && !/total/' | sort -rn
```
