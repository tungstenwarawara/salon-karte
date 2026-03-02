-- 予約キャンセルトークン: 顧客がメールリンクからキャンセルできるようにする
-- Web予約時にUUIDを生成し、メール内のキャンセルリンクに埋め込む

ALTER TABLE appointments
  ADD COLUMN cancel_token UUID DEFAULT NULL;

-- キャンセルリンクからの高速検索用インデックス
CREATE UNIQUE INDEX idx_appointments_cancel_token
  ON appointments (cancel_token)
  WHERE cancel_token IS NOT NULL;
