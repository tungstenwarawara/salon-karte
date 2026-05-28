-- セットアップ時の業種選択を保存する列を追加
-- 用途: メニュープリセット分岐、将来的なターゲット施策の分析

ALTER TABLE salons
  ADD COLUMN business_type TEXT
  CHECK (business_type IN (
    'esthetic',         -- エステ
    'eyelash',          -- まつ毛
    'nail',             -- ネイル
    'hair',             -- ヘアサロン
    'bodycare',         -- ボディケア・整体
    'other'             -- その他
  ));

COMMENT ON COLUMN salons.business_type IS 'セットアップ時に選択された業種。メニュープリセット分岐に使用';
