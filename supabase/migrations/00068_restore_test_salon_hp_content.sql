-- テストサロン花 (id=00000000-0000-0000-0000-000000000001) のHPコンテンツを復元
-- 経緯:
--   - 00061 で hp_enabled / hp_content カラム追加
--   - 00062〜00065 で部分更新 (jsonb_set) を重ねたが、
--     ベースとなる初期 hp_content JSON は当時 Supabase ダッシュボードから直接投入され
--     コミット外だったため、何らかのリセットで NULL に戻った状態
--   - ストレージ (salon-hp-photos) の画像16枚は健在
-- 本マイグレーションでは 00064 / 00065 で復元可能な本文を全部取り込み、
-- 失われていた hero見出し・concept・flow・testimonials・faq・links等は
-- 「※サンプル」マーカー付きで汎用バストケアサロン用の暫定文を投入する
-- （SEI様向け本番HPは別salon_idで作るため、ここはテスト参照用）

UPDATE salons
SET
  hp_enabled = true,
  hp_content = '{
    "hero": {
      "headline": "※サンプル: 銀座のバストケア専門サロン",
      "subheadline": "※サンプル: 完全個室・女性専用。プロの技術で、あなたの理想のラインへ。",
      "image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-private-room.jpg",
      "trust_badges": [
        {"label": "口コミ評価", "value": "5.0"},
        {"label": "完全個室", "value": "プライベート空間"},
        {"label": "銀座駅", "value": "徒歩2分"}
      ]
    },
    "concerns": {
      "title": "こんなお悩みありませんか？",
      "items": [
        "バストのサイズダウンが気になる",
        "ハリや弾力が衰えてきた",
        "左右のバランスが気になる",
        "自己流のケアに限界を感じている",
        "デコルテラインに自信がない"
      ]
    },
    "about": {
      "title": "サロンについて",
      "description": "※サンプル: 銀座の隠れ家サロンで、お一人おひとりに寄り添ったバストケアをご提供します。完全個室・女性専用。",
      "owner_name": "※サンプル: オーナー名",
      "owner_title": "※サンプル: バストケアセラピスト",
      "owner_image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/owner-profile.jpg",
      "story": "※サンプル: 以下はダミーテキストです。正しい知識と技術があれば変われることを実感し、同じ悩みを持つ女性のお力になりたいと思い、バストケア専門サロンを開業しました。",
      "qualifications": ["※サンプル: バストケアセラピスト認定", "※サンプル: エステティシャン資格", "※サンプル: 解剖学基礎修了"],
      "message": "「誰にも相談できない」そんなデリケートなお悩みこそ、プロにお任せください。完全個室・女性専用の安心できる空間で、あなたの理想のラインを一緒に目指しましょう。"
    },
    "concept": {
      "title": "私たちのこだわり",
      "points": [
        {"title": "完全個室・女性専用", "description": "※サンプル: 周りの目を気にせずリラックスできる、完全個室のプライベート空間でお過ごしいただけます。"},
        {"title": "オーダーメイド施術", "description": "※サンプル: お一人おひとりの体質・お悩みに合わせ、最適なコースをカウンセリングからご提案します。"},
        {"title": "アフターケアまで一貫", "description": "※サンプル: 施術後のホームケアアドバイス・LINE相談まで、長期的にお客様の理想を支えます。"}
      ]
    },
    "before_after": {
      "title": "施術実績",
      "items": [
        {"image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/before-after-01.jpg", "caption": "※サンプル: バストアップコース 3回目の変化。ハリと丸みが出てきました。", "menu": "バストUP育乳コース"},
        {"image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/before-after-02.jpg", "caption": "※サンプル: 上半身ケアとの組み合わせで姿勢も改善。デコルテラインがすっきり。", "menu": "上半身ケア + バストUP"},
        {"image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/before-after-03.jpg", "caption": "※サンプル: 左右差のお悩みに。バランスが整ってきました。", "menu": "バストUP育乳コース"},
        {"image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/before-after-04.jpg", "caption": "※サンプル: 産後のバストケア。ふっくらとしたラインが戻ってきました。", "menu": "産後ケアコース"},
        {"image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/before-after-05.jpg", "caption": "※サンプル: ブライダル前の集中ケア。ドレスに映えるデコルテラインに。", "menu": "ブライダルコース"}
      ]
    },
    "flow": {
      "steps": [
        {"title": "ご予約", "description": "※サンプル: WEB予約またはLINEで希望日時をお知らせください。"},
        {"title": "カウンセリング", "description": "※サンプル: お悩み・ご希望・体質を丁寧にヒアリングし、最適なコースをご提案します。"},
        {"title": "施術", "description": "※サンプル: 完全個室で、心地よい音楽とアロマに包まれながら本格ケアをお受けいただけます。"},
        {"title": "アフターケア", "description": "※サンプル: 施術後のお茶とともに、ホームケアのアドバイスをお伝えします。"}
      ]
    },
    "gallery": {
      "images": [
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
      ]
    },
    "testimonials": {
      "items": [
        {"name": "※サンプル: A.K様 30代", "content": "※サンプル: 通い始めて3ヶ月、左右のバランスが整い、自分に自信が持てるようになりました。", "menu": "バストUP育乳コース"},
        {"name": "※サンプル: M.S様 40代", "content": "※サンプル: 完全個室で他の方の目を気にせずリラックスできます。施術後の肌のハリも違います。", "menu": "上半身ケア + バストUP"},
        {"name": "※サンプル: Y.T様 30代", "content": "※サンプル: 産後のお悩みでしたが、丁寧にカウンセリングしていただき安心して通えています。", "menu": "産後ケアコース"}
      ],
      "hotpepper_rating": 5.0,
      "hotpepper_review_count": 14,
      "hotpepper_url": "https://beauty.hotpepper.jp/kr/slnH000609379/review/"
    },
    "pricing": {
      "title": "※サンプル: 初回限定トライアル",
      "original_price": 15000,
      "trial_price": 5980,
      "description": "※サンプル: 初めての方限定で、人気のバストUP育乳コースを特別価格でお試しいただけます。",
      "note": "※サンプル: お一人様1回限り / カウンセリング込み約90分"
    },
    "faq": {
      "items": [
        {"question": "施術中に痛みはありますか？", "answer": "※サンプル: 心地よい圧で行うため痛みはほとんどありません。施術中はリラックスしてお過ごしいただけます。"},
        {"question": "どのくらいの頻度で通えばよいですか？", "answer": "※サンプル: 効果実感のためには2週間に1回のペースを推奨しています。お悩みやライフスタイルに合わせてご相談ください。"},
        {"question": "予約のキャンセルはできますか？", "answer": "※サンプル: ご予約日の前日17時までにご連絡いただければ無料でキャンセル・変更が可能です。"},
        {"question": "支払い方法は？", "answer": "※サンプル: 現金・各種クレジットカード・電子マネーに対応しております。"},
        {"question": "駐車場はありますか？", "answer": "※サンプル: 専用駐車場はございません。お近くのコインパーキングをご利用ください。"}
      ]
    },
    "access": {
      "station": "東京メトロ銀座駅 徒歩2分",
      "details": "※サンプル: 東京都中央区銀座1-15-13 VORT銀座residence。地下鉄銀座駅 A13出口より徒歩2分。",
      "google_maps_embed_url": "https://www.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E4%B8%AD%E5%A4%AE%E5%8C%BA%E9%8A%80%E5%BA%A71-15-13+VORT%E9%8A%80%E5%BA%A7residence&output=embed"
    },
    "links": {
      "instagram": "https://www.instagram.com/ruika_sei/",
      "line_url": null,
      "website": null
    }
  }'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000001';
