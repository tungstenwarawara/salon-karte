# セキュリティルール

## マルチテナント分離（最重要）
全データアクセスは現在のサロンにスコープすること。

### Supabaseクエリルール
- 全クエリに `.eq("salon_id", salon.id)` 必須（RLSが有効でも必ず付与）
- INSERT時: salon_id フィールドを必ず含める
- 関連テーブル: 親テーブル経由でsalon_idフィルタが効いているか確認
- RPC関数: 引数に `p_salon_id` を渡し、関数内でも検証

### RLS（Row Level Security）
- 全テーブルにRLS有効
- 全RLSポリシー: `auth.uid() = (SELECT user_id FROM salons WHERE id = table.salon_id)`
- コード側のsalon_idフィルタは防御の多層化（RLSの代替ではない）

### RPC関数セキュリティ
- `SECURITY INVOKER`（DEFINERではない）
- `SET search_path = public`
- `p_salon_id` パラメータで内部検証

## 認証フロー
- `middleware.ts`: `/dashboard` 以下は認証必須
- 各ページの `getAuthAndSalon()`: ユーザー → サロン紐づけ確認
- サロン未作成: `/setup` にリダイレクト
- 未認証: `/login` にリダイレクト

## 入力バリデーション
- 数値: `parseInt`/`parseFloat` → `isNaN` チェック
- 日付: 不正な日付はフォーム側でブロック
- 文字列: Supabase SDKのパラメータ化クエリ（SQL injection防止）
- ファイルアップロード: MIME type チェック + マジックナンバー検証 + 20MB制限

## 環境変数
- シークレットをハードコードしない
- `.env` / `.env.local` / `.env.production` はgit管理外

## マージ前セキュリティチェック
- `get_advisors(type: "security")` に新規警告なし
- RLSが全テーブルで有効
- 環境変数がハードコードされていない
- 全Supabaseクエリにsalon_idフィルタが存在
