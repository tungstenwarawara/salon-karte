-- salons に紹介コードカラム追加
ALTER TABLE salons ADD COLUMN referral_code TEXT UNIQUE;

-- 既存サロンに紹介コードを生成（8文字のランダム英数字）
UPDATE salons SET referral_code = upper(substr(md5(random()::text), 1, 8))
WHERE referral_code IS NULL;

-- NOT NULL 制約を後から追加
ALTER TABLE salons ALTER COLUMN referral_code SET NOT NULL;

-- デフォルト値を設定（新規サロン用）
ALTER TABLE salons ALTER COLUMN referral_code SET DEFAULT upper(substr(md5(random()::text), 1, 8));

-- 紹介テーブル
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  referred_salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'rewarded')),
  referrer_reward_applied_at TIMESTAMPTZ,
  referred_reward_applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referred_salon_id)
);

-- RLS 有効化
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- 紹介者 or 被紹介者のサロンオーナーが参照可能
CREATE POLICY referrals_select ON referrals FOR SELECT
  USING (
    referrer_salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
    OR referred_salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- 被紹介者（サインアップ中のユーザー）が INSERT 可能
CREATE POLICY referrals_insert ON referrals FOR INSERT
  WITH CHECK (
    referred_salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

-- インデックス
CREATE INDEX idx_referrals_referrer ON referrals(referrer_salon_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_salons_referral_code ON salons(referral_code);
