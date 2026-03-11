-- SEI サロン: hp_content に写真URL、Googleマップ、HotPepper評価データを追加
-- 写真は salon-hp-photos バケット（00061で作成済み）にアップロード済み

UPDATE salons
SET hp_content = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          hp_content,
          '{hero,image_path}',
          '"https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-private-room.jpg"'
        ),
        '{gallery,images}',
        '[
          {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-private-room.jpg", "caption": "完全個室の施術ルーム"},
          {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-salon.jpg", "caption": "落ち着いた雰囲気のサロン内装"},
          {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-decor.jpg", "caption": "こだわりのインテリア"},
          {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-dressing.jpg", "caption": "パウダールーム"},
          {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/products-homecare.jpg", "caption": "ホームケア商品"},
          {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/products-breastcare.jpg", "caption": "バストケア専用商品"},
          {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/treatment-rf.jpg", "caption": "RF機器による施術"},
          {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/treatment-shoulder.jpg", "caption": "上半身トータルケア"},
          {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/gallery-01.jpg", "caption": "施術の様子"},
          {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/gallery-02.jpg", "caption": "施術の様子"}
        ]'::jsonb
      ),
      '{access,google_maps_embed_url}',
      '"https://www.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E4%B8%AD%E5%A4%AE%E5%8C%BA%E9%8A%80%E5%BA%A71-15-13+VORT%E9%8A%80%E5%BA%A7residence&output=embed"'
    ),
    '{testimonials,hotpepper_rating}',
    '5.0'
  ),
  '{testimonials,hotpepper_review_count}',
  '14'
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- before_after セクションを追加
UPDATE salons
SET hp_content = jsonb_set(
  hp_content,
  '{before_after}',
  '{
    "title": "施術実績",
    "items": [
      {
        "image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/before-after-01.jpg",
        "caption": "バストアップコース 3回目の変化。ハリと丸みが出てきました。",
        "menu": "バストUP育乳コース"
      },
      {
        "image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/before-after-02.jpg",
        "caption": "上半身ケアとの組み合わせで姿勢も改善。デコルテラインがすっきり。",
        "menu": "上半身ケア + バストUP"
      },
      {
        "image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/before-after-03.jpg",
        "caption": "左右差のお悩みに。バランスが整ってきました。",
        "menu": "バストUP育乳コース"
      },
      {
        "image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/before-after-04.jpg",
        "caption": "産後のバストケア。ふっくらとしたラインが戻ってきました。",
        "menu": "産後ケアコース"
      },
      {
        "image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/before-after-05.jpg",
        "caption": "ブライダル前の集中ケア。ドレスに映えるデコルテラインに。",
        "menu": "ブライダルコース"
      }
    ]
  }'::jsonb
)
WHERE id = '00000000-0000-0000-0000-000000000001';

-- HotPepperレビューページへのリンク追加
UPDATE salons
SET hp_content = jsonb_set(
  hp_content,
  '{testimonials,hotpepper_url}',
  '"https://beauty.hotpepper.jp/kr/slnH000609379/review/"'
)
WHERE id = '00000000-0000-0000-0000-000000000001';
