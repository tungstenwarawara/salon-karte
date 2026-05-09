-- セキュリティ修正: resend-confirmation API の listUsers() 全件取得を解消
--
-- 背景:
--   src/app/api/auth/resend-confirmation/route.ts が auth.admin.listUsers() で
--   全ユーザーを取得して email で線形検索していた。
--   ユーザー数が Supabase デフォルト perPage(1000) を超えた瞬間、対象ユーザーが
--   見つからず確認メール再送が無音で壊れる。
--
-- 対応:
--   service_role からのみ呼び出せる SECURITY DEFINER 関数を追加し、
--   auth.users を email でインデックス検索する。
--   anon/authenticated には EXECUTE 権限を与えない（情報漏洩防止）。

CREATE OR REPLACE FUNCTION public.auth_user_lookup_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  email_confirmed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id, u.email::TEXT, u.email_confirmed_at
  FROM auth.users u
  WHERE u.email = p_email
  LIMIT 1;
$$;

-- 公開ロールへの EXECUTE を取り消し、service_role のみが呼び出せる状態にする
REVOKE EXECUTE ON FUNCTION public.auth_user_lookup_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auth_user_lookup_by_email(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.auth_user_lookup_by_email(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_lookup_by_email(TEXT) TO service_role;

COMMENT ON FUNCTION public.auth_user_lookup_by_email(TEXT) IS
  'service_role 専用。auth.users を email で検索。確認メール再送のような管理処理で listUsers 全件取得を回避するためのもの。';
