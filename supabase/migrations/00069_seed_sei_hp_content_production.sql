-- テストサロン花のHPコンテンツを「バスト専門店SEI」本番品質でセットアップ
-- 用途: テストでオーナー様確認 → SEI様の本番salon_idへ移植
-- 情報源: HotPepper Beauty (https://beauty.hotpepper.jp/kr/slnH000609379/)
--
-- 本マイグレーションは 00068 を完全に置換する（同じカラムを上書き）。
-- - ※サンプル表記なし（本番想定）
-- - 写真は salon-hp-photos バケットにアップロード済みの SEI様実物10枚
-- - Before/After / pricing セクションは hp_content に含めない（条件分岐で非表示）

UPDATE salons
SET
  hp_enabled = true,
  hp_content = '{
    "hero": {
      "headline": "銀座のバストケア専門サロン",
      "subheadline": "口コミ★5.0・リピート率9割。施術歴16年のオーナーが、お一人おひとりに寄り添うオーダーメイドケア。",
      "image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-treatment-room.jpg",
      "trust_badges": [
        {"label": "口コミ評価", "value": "★5.0"},
        {"label": "完全個室", "value": "プライベート空間"},
        {"label": "銀座一丁目駅", "value": "徒歩2分"}
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
      "title": "バスト専門店 SEI について",
      "description": "銀座一丁目駅から徒歩2分、完全個室・女性専用のバストケア専門サロン。施術歴16年のオーナーが、お一人おひとりに寄り添うオーダーメイドケアでリピート率9割を実現しています。",
      "owner_name": "佐澤 流行香",
      "owner_title": "オーナーセラピスト ／ 施術歴16年",
      "owner_image_path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/owner-main.jpg",
      "story": "大手有名エステサロンで基礎を学び、専門性の高いサロンで経験を積んできました。バストケアは変化が分かりやすく、お客様の喜ぶ姿に「もっと多くの女性のお力になりたい」とのめり込んでいき、最善のケアを提供できる場所として銀座にバスト専門店SEIをオープンしました。",
      "qualifications": [
        "エステ施術歴16年",
        "大手エステサロンでの基礎研修修了",
        "バストケア専門技術の習得"
      ],
      "message": "「貴女だけの施術で、結果を出します」。デリケートなお悩みこそ、プロにご相談ください。完全個室の安心空間で、丁寧なカウンセリングからお一人おひとりに最適なケアをご提案します。"
    },
    "concept": {
      "title": "SEIの3つのこだわり",
      "points": [
        {"title": "完全個室・女性専用", "description": "周りの目を気にせずリラックスできる完全個室のプライベート空間。デリケートなお悩みも、安心してご相談いただけます。"},
        {"title": "ハンド技術 × 高周波マシン", "description": "丁寧なハンドマッサージと高周波マシンを組み合わせたオーダーメイドケアで、変化と持続力を両立します。"},
        {"title": "16年の経験を活かした技術", "description": "大手サロンから専門サロンまで幅広い経験を持つオーナーが、すべての施術を直接担当します。"}
      ]
    },
    "flow": {
      "steps": [
        {"title": "ご予約", "description": "WEBまたはお電話・LINEで、ご希望の日時をお知らせください。初めての方も歓迎です。"},
        {"title": "カウンセリング", "description": "現在のお悩み・ご希望・体質を丁寧にヒアリング。あなたに合った最適なコースをご提案します。"},
        {"title": "施術", "description": "完全個室で、ハンド技術と高周波マシンを組み合わせたオーダーメイドケア。心地よい時間をお過ごしください。"},
        {"title": "アフターケア", "description": "施術後はドリンクサービスとともに、ご自宅でのケア方法をお伝えします。"}
      ]
    },
    "gallery": {
      "images": [
        {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-treatment-room.jpg", "caption": "完全個室の施術ルーム"},
        {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-decor-corner.jpg", "caption": "上品な装飾コーナー"},
        {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-decor.jpg", "caption": "こだわりのインテリア"},
        {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-salon.jpg", "caption": "落ち着いた雰囲気のサロン"},
        {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/interior-entrance.jpg", "caption": "サロンエントランス"},
        {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/products-supplements.jpg", "caption": "BE-MAX シリーズ"},
        {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/products-premium.jpg", "caption": "プレミアム美容アイテム"},
        {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/products-skincare.jpg", "caption": "KIREI スキンケア"},
        {"path": "https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/owner-sub.jpg", "caption": "オーナーセラピスト"}
      ]
    },
    "testimonials": {
      "items": [
        {"name": "まみ様 70代", "content": "しっかりとヒアリングしていただいて、しっかり施術していただいたので効果が出ました。とても綺麗な雰囲気の良いお部屋です。", "menu": "オールハンド★バストアップ"},
        {"name": "kk様 30代後半", "content": "絶対にオススメしたいサロンNo.1です！通い出してしばらく経ちますが毎回初めてのときと同じような丁寧な施術をしていただいています。", "menu": "回数券会員様"},
        {"name": "アヤハ様 20代", "content": "前後の写真ではっきりわかる変化で、胸は柔らかくふわふわになりました。", "menu": "オールハンド★バストアップ"}
      ],
      "hotpepper_rating": 5.0,
      "hotpepper_review_count": 15,
      "hotpepper_url": "https://beauty.hotpepper.jp/kr/slnH000609379/review/"
    },
    "faq": {
      "items": [
        {"question": "施術中に痛みはありますか？", "answer": "心地よい圧で行うため、痛みはほとんどありません。施術中はリラックスしてお過ごしいただけます。"},
        {"question": "どのくらいの頻度で通えばよいですか？", "answer": "効果を実感いただくためには、2週間に1回のペースを推奨しています。お悩みやライフスタイルに合わせてご相談ください。"},
        {"question": "予約のキャンセル・変更はできますか？", "answer": "ご予約日の前日までにご連絡いただければ、無料でキャンセル・変更が可能です。"},
        {"question": "支払い方法は何がありますか？", "answer": "現金のほか、Visa／Mastercard／JCB／American Express／Diners Club／Discover の各種クレジットカードに対応しております。"},
        {"question": "男性も利用できますか？", "answer": "申し訳ございませんが、女性専用サロンとなっております。" },
        {"question": "駐車場はありますか？", "answer": "専用駐車場はございません。お近くのコインパーキングをご利用ください。" }
      ]
    },
    "access": {
      "station": "有楽町線 銀座一丁目駅 10番出口より徒歩2分",
      "details": "東京都中央区銀座1-15-13 VORT銀座residence904 ／ 銀座線・日比谷線・丸の内線 銀座駅からも徒歩6分。ホテルサンルート銀座隣のマンション、駐車場の奥のビルです。",
      "google_maps_embed_url": "https://www.google.com/maps?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E4%B8%AD%E5%A4%AE%E5%8C%BA%E9%8A%80%E5%BA%A71-15-13+VORT%E9%8A%80%E5%BA%A7residence&output=embed"
    },
    "links": {
      "instagram": "https://www.instagram.com/ruika_sei/",
      "line_url": null,
      "website": "https://beauty.hotpepper.jp/kr/slnH000609379/"
    }
  }'::jsonb
WHERE id = '00000000-0000-0000-0000-000000000001';
