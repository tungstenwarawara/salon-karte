-- サロンHP 競合改善: 信頼バッジ・お悩み・オーナーストーリー・料金セクション

-- 1. Trust Badges（ヒーロー）
UPDATE salons
SET hp_content = jsonb_set(
  hp_content,
  '{hero,trust_badges}',
  '[
    {"label": "口コミ評価", "value": "5.0"},
    {"label": "完全個室", "value": "プライベート空間"},
    {"label": "銀座駅", "value": "徒歩2分"}
  ]'::jsonb
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. お悩みセクション
UPDATE salons
SET hp_content = jsonb_set(
  hp_content,
  '{concerns}',
  '{
    "title": "こんなお悩みありませんか？",
    "items": [
      "バストのサイズダウンが気になる",
      "ハリや弾力が衰えてきた",
      "左右のバランスが気になる",
      "産後のバストラインの変化が気になる",
      "自己流のケアに限界を感じている",
      "デコルテラインに自信がない"
    ]
  }'::jsonb
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. オーナーストーリー拡張
UPDATE salons
SET hp_content = jsonb_set(
  jsonb_set(
    jsonb_set(
      hp_content,
      '{about,story}',
      '"私自身、産後のバストの変化に悩んだ経験があります。さまざまなケアを試す中で、正しい知識と技術があれば変われることを実感しました。その経験を活かし、同じ悩みを持つ女性のお力になりたいと思い、バストケア専門サロンを開業しました。"'
    ),
    '{about,qualifications}',
    '["バストケアセラピスト認定", "エステティシャン資格", "解剖学基礎修了"]'::jsonb
  ),
  '{about,message}',
  '"「誰にも相談できない」そんなデリケートなお悩みこそ、プロにお任せください。完全個室・女性専用の安心できる空間で、あなたの理想のラインを一緒に目指しましょう。"'
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 4. 料金セクション（初回限定トライアル）
UPDATE salons
SET hp_content = jsonb_set(
  hp_content,
  '{pricing}',
  '{
    "title": "初回限定トライアル",
    "original_price": 15000,
    "trial_price": 5980,
    "description": "初めての方限定で、人気のバストUP育乳コースを特別価格でお試しいただけます。",
    "note": "お一人様1回限り / カウンセリング込み約90分"
  }'::jsonb
)
WHERE id = '00000000-0000-0000-0000-000000000001';
