-- セキュリティ修正: salon-hp-photos バケットの listing 許可を削除
--
-- 背景:
--   00061_salon_homepage.sql で `salon_hp_photos_select` ポリシーを作成し、
--   storage.objects に対して bucket_id 一致の SELECT を全公開していた。
--   これにより storage.from('salon-hp-photos').list() で全ファイル名を列挙できる状態。
--   Supabase advisor (public_bucket_allows_listing) が WARN を出していた。
--
-- 対応:
--   バケットは public フラグを持っており、個別の object URL は SELECT ポリシー
--   なしでも公開アクセス可能（/storage/v1/object/public/<bucket>/<path>）。
--   よって SELECT ポリシーは不要であり、削除しても HP 表示には影響しない。
--   削除後は list() による列挙ができなくなり、ファイル名総当たり攻撃を防げる。
--
-- 影響範囲確認:
--   - HP 公開ページ（/s/[slug]）は hp_content JSONB に保存された URL を直接使うため影響なし
--   - INSERT / DELETE ポリシーはオーナー本人のみで残しているのでアップロード・削除は引き続き可能

DROP POLICY IF EXISTS "salon_hp_photos_select" ON storage.objects;

-- 確認: 残っているポリシーは insert / delete の2本のみ（オーナー操作用）
-- INSERT/DELETE ポリシーは 00061 で salon_id ベースのオーナー検証付き
