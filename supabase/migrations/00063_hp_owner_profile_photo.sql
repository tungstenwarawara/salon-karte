-- SEI サロン: オーナープロフィール画像を追加（Instagramから取得）

UPDATE salons
SET hp_content = jsonb_set(
  hp_content,
  '{about,owner_image_path}',
  '"https://yeifmxnzhzrdfeeyitlw.supabase.co/storage/v1/object/public/salon-hp-photos/00000000-0000-0000-0000-000000000001/owner-profile.jpg"'
)
WHERE id = '00000000-0000-0000-0000-000000000001';
