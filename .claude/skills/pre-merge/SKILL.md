---
name: pre-merge
description: マージ前の全チェックを実行する
disable-model-invocation: true
---

マージ前チェックリストを順番に実行し、全てパスすることを確認する。

## 1. 型チェック
```bash
npx tsc --noEmit
```

## 2. ビルド確認
```bash
npm run build
```

## 3. カラム名・salon_idフィルタ照合
```bash
python3 scripts/check-select-columns.sh
```

## 4. ファイルサイズ違反チェック
```bash
# ページ: 300行超え
wc -l src/app/\(dashboard\)/*/page.tsx src/app/\(dashboard\)/*/*/page.tsx src/app/\(dashboard\)/*/*/*/page.tsx src/app/\(dashboard\)/*/*/*/*/page.tsx 2>/dev/null | awk '$1 > 300 && !/total/' | sort -rn

# コンポーネント: 200行超え
wc -l src/components/**/*.tsx 2>/dev/null | awk '$1 > 200 && !/total/' | sort -rn
```

## 5. セキュリティ確認
- Supabase MCP の `get_advisors(type: "security")` を実行し新規警告がないか確認
- `.env` ファイルがgit管理に入っていないか `git status` で確認

## 結果報告
全チェックの結果をまとめて報告する。失敗がある場合は修正方法を提案する。
