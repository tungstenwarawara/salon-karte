"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

/**
 * スタッフ招待: メール送信 + staff レコード作成
 * オーナーのみ実行可能
 */
export async function inviteStaff(
  name: string,
  email: string,
  role: "manager" | "staff"
) {
  const { user, salon, staff, supabase } = await getAuthAndSalon();

  if (!user || !salon) {
    return { error: "認証エラー" };
  }

  // オーナー権限チェック（staff レコードがある場合 + フォールバック）
  if (staff && staff.role !== "owner") {
    return { error: "スタッフの招待はオーナーのみ実行できます" };
  }

  // 既存スタッフのメール重複チェック
  const { data: existing } = await supabase
    .from("staff")
    .select("id, is_active")
    .eq("salon_id", salon.id)
    .eq("email", email)
    .single();

  if (existing) {
    return { error: "このメールアドレスは既に登録されています" };
  }

  // Supabase Admin でユーザー招待（auth.users に作成 + 招待メール送信）
  const adminClient = createAdminClient();
  const { data: invitedUser, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/update-password%3Finvite%3D1`,
    });

  if (inviteError || !invitedUser.user) {
    console.error("招待メール送信エラー:", inviteError);
    return { error: `招待メールの送信に失敗しました: ${inviteError?.message || "不明なエラー"}` };
  }

  // staff レコード作成（auth_user_id は招待時点で確定）
  const { error: insertError } = await supabase.from("staff").insert({
    salon_id: salon.id,
    auth_user_id: invitedUser.user.id,
    name,
    email,
    role,
  });

  if (insertError) {
    console.error("staff レコード作成エラー:", insertError);
    return { error: `スタッフの登録に失敗しました: ${insertError.message}` };
  }

  return { success: true };
}

/**
 * スタッフ情報更新（名前・権限）
 * オーナーのみ実行可能
 */
export async function updateStaff(
  staffId: string,
  name: string,
  role: "owner" | "manager" | "staff"
) {
  const { user, salon, staff, supabase } = await getAuthAndSalon();

  if (!user || !salon) {
    return { error: "認証エラー" };
  }

  if (staff && staff.role !== "owner") {
    return { error: "スタッフの編集はオーナーのみ実行できます" };
  }

  const { error: updateError } = await supabase
    .from("staff")
    .update({ name, role })
    .eq("id", staffId)
    .eq("salon_id", salon.id);

  if (updateError) {
    console.error("staff 更新エラー:", updateError);
    return { error: `更新に失敗しました: ${updateError.message}` };
  }

  return { success: true };
}

/**
 * スタッフ無効化/再有効化
 * オーナーのみ実行可能。オーナー自身は無効化不可。
 */
export async function toggleStaffActive(staffId: string, isActive: boolean) {
  const { user, salon, staff, supabase } = await getAuthAndSalon();

  if (!user || !salon) {
    return { error: "認証エラー" };
  }

  if (staff && staff.role !== "owner") {
    return { error: "スタッフの状態変更はオーナーのみ実行できます" };
  }

  // オーナー自身の無効化を防止
  if (!isActive && staff?.id === staffId) {
    return { error: "オーナー自身を無効化することはできません" };
  }

  const { error: updateError } = await supabase
    .from("staff")
    .update({ is_active: isActive })
    .eq("id", staffId)
    .eq("salon_id", salon.id);

  if (updateError) {
    console.error("staff 状態更新エラー:", updateError);
    return { error: `状態変更に失敗しました: ${updateError.message}` };
  }

  return { success: true };
}
