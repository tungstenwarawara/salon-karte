---
globs:
  - "src/app/**/*.tsx"
  - "src/app/**/*.ts"
  - "src/lib/**/*.ts"
---

# パフォーマンスルール

## ダッシュボード（最重要ページ）
- 目標: 1秒以内のロード
- 全クエリを `Promise.all` で並列実行
- クエリ数を不用意に増やさない

## クエリ最適化パターン

### 良いパターン
```
.select("id, name, price").eq("salon_id", salon.id)  // 明示的カラム指定
.select("id", { count: "exact", head: true })         // カウントのみ、データ転送ゼロ
supabase.rpc("get_monthly_sales_summary", ...)         // 集計はDBで
```

### 禁止パターン
```
.select("*")                    // 不要カラムも取得
.select("*").then(d => d.length) // 全データ取得してカウント
```
- 大量データの `.reduce()` / `.filter()` はRPC関数でDB側集計

## Server vs Client Component
- Server Component: データ取得
- Client Component: ユーザーインタラクションのみ
- `loading.tsx`: 即座にスケルトン表示

## 画像
- アップロード前に自動圧縮（最大1200px + JPEG 85%品質、元ファイル20MB上限）
- Supabase Storage の signed URL（1時間有効）
- 複数写真は `getPhotoUrls()` で一括取得（`createSignedUrls` 複数形API）。個別 `getPhotoUrl()` のループ禁止
- 表示時は `loading="lazy"` 必須

## フォーム下書き
- `useFormDraft` hook で localStorage に自動保存

## 新規ページ パフォーマンスチェック
- 全クエリが `Promise.all` で並列化されているか
- `head: true` + `count: 'exact'` をカウント専用クエリに使用しているか
- `select('*')` がないか（明示的カラム指定のみ）
- 集計処理がDB側（RPC関数）で行われているか
