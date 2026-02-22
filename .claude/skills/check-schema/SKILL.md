---
name: check-schema
description: DBスキーマとソースコードのカラム名整合性を検証する
disable-model-invocation: true
---

DBスキーマとソースコードの整合性を検証する。

## 1. カラム名照合スクリプト実行
```bash
python3 scripts/check-select-columns.sh
```

## 2. エラーがあった場合
- 該当ファイルを開き、正しいカラム名に修正
- `supabase/migrations/` のSQLファイルで正しいカラム名を確認
- 修正後に再度スクリプトを実行して確認

## 3. 警告（salon_idフィルタ欠落）があった場合
- 該当クエリに `.eq("salon_id", salon.id)` を追加
- RPC関数の場合は引数に `p_salon_id` が渡されているか確認
