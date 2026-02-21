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
