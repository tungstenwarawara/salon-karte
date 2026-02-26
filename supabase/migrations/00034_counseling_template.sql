-- salonsテーブルにカウンセリングシートテンプレート用のJSONBカラムを追加
-- NULLの場合はデフォルトテンプレートを使用
ALTER TABLE salons ADD COLUMN counseling_template jsonb DEFAULT NULL;

COMMENT ON COLUMN salons.counseling_template IS 'カウンセリングシートのテンプレート定義（JSONB）。NULLならデフォルトテンプレートを使用。';
