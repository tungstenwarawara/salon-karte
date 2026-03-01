"use server";

import * as Sentry from "@sentry/nextjs";
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
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password?invite=1`,
    });

  if (inviteError || !invitedUser.user) {
    console.error("招待メール送信エラー:", inviteError);
    Sentry.captureException(inviteError ?? new Error("招待メール送信失敗"), { tags: { feature: "staff-invite" } });
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
    Sentry.captureException(new Error(`staff作成エラー: ${insertError.message}`), { tags: { feature: "staff-invite" } });
    return { error: `スタッフの登録に失敗しました: ${insertError.message}` };
  }

  return { success: true };
}

/**
 * 招待メール再送信（パスワード再設定メール）
 * オーナーのみ実行可能
 * 既存ユーザーには resetPasswordForEmail を使用
 */
export async function resendInvite(staffId: string) {
  const { user, salon, staff, supabase } = await getAuthAndSalon();

  if (!user || !salon) {
    return { error: "認証エラー" };
  }

  if (staff && staff.role !== "owner") {
    return { error: "招待メールの再送はオーナーのみ実行できます" };
  }

  // 対象スタッフのメールアドレスを取得
  const { data: target } = await supabase
    .from("staff")
    .select("email, role, auth_user_id")
    .eq("id", staffId)
    .eq("salon_id", salon.id)
    .single();

  if (!target) {
    return { error: "スタッフが見つかりません" };
  }

  if (target.role === "owner") {
    return { error: "オーナーには招待メールを送信できません" };
  }

  const adminClient = createAdminClient();

  // auth_user_id が存在する = 既にauth.usersに登録済み → パスワード再設定メールを送信
  // auth_user_id が null = 未登録 → inviteUserByEmail で招待
  if (target.auth_user_id) {
    // パスワードをランダム値にリセットしてから recovery メールを送信
    // 理由: ユーザーが以前と同じパスワードを設定しようとすると
    // Supabase が "same_password" エラーを返して詰まるため
    const { error: updateError } =
      await adminClient.auth.admin.updateUserById(target.auth_user_id, {
        password: crypto.randomUUID(),
      });

    if (updateError) {
      console.error("パスワードリセットエラー:", updateError);
      Sentry.captureException(updateError, { tags: { feature: "staff-resend" } });
      return { error: `招待メールの再送に失敗しました: ${updateError.message}` };
    }

    // リカバリーメール送信
    const { error: resetError } =
      await adminClient.auth.resetPasswordForEmail(target.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password?invite=1`,
      });

    if (resetError) {
      console.error("招待メール再送エラー:", resetError);
      Sentry.captureException(resetError, { tags: { feature: "staff-resend" } });
      return { error: `招待メールの再送に失敗しました: ${resetError.message}` };
    }
  } else {
    // 未登録ユーザー: inviteUserByEmail で新規招待
    const { data: invitedUser, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(target.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password?invite=1`,
      });

    if (inviteError) {
      console.error("招待メール再送エラー:", inviteError);
      Sentry.captureException(inviteError, { tags: { feature: "staff-resend" } });
      return { error: `招待メールの再送に失敗しました: ${inviteError.message}` };
    }

    // auth_user_id を更新（初回招待時にstaffレコードにIDが未設定の場合）
    if (invitedUser?.user) {
      await supabase
        .from("staff")
        .update({ auth_user_id: invitedUser.user.id })
        .eq("id", staffId)
        .eq("salon_id", salon.id);
    }
  }

  return { success: true };
}

/**
 * スタッフ完全削除（auth.users + staff レコード + 予約の紐づけ解除）
 * オーナーのみ実行可能。オーナー自身は削除不可。
 * auth.users を先に削除し、失敗時はstaffレコードを残す（孤立防止）
 */
export async function deleteStaff(staffId: string) {
  const { user, salon, staff, supabase } = await getAuthAndSalon();

  if (!user || !salon) {
    return { error: "認証エラー" };
  }

  if (staff && staff.role !== "owner") {
    return { error: "スタッフの削除はオーナーのみ実行できます" };
  }

  // 対象スタッフを取得
  const { data: target } = await supabase
    .from("staff")
    .select("id, auth_user_id, role")
    .eq("id", staffId)
    .eq("salon_id", salon.id)
    .single();

  if (!target) {
    return { error: "スタッフが見つかりません" };
  }

  if (target.role === "owner") {
    return { error: "オーナーは削除できません" };
  }

  // 1. auth.users から先に削除（孤立レコード防止）
  if (target.auth_user_id) {
    const adminClient = createAdminClient();
    const { error: authDeleteError } =
      await adminClient.auth.admin.deleteUser(target.auth_user_id);

    if (authDeleteError) {
      console.error("auth.users 削除エラー:", authDeleteError);
      Sentry.captureException(authDeleteError, { tags: { feature: "staff-delete" } });
      return { error: `アカウント削除に失敗しました: ${authDeleteError.message}` };
    }
  }

  // 2. 紐づく予約の staff_id を NULL に
  await supabase
    .from("appointments")
    .update({ staff_id: null })
    .eq("staff_id", staffId)
    .eq("salon_id", salon.id);

  // 3. staff レコード削除
  const { error: deleteError } = await supabase
    .from("staff")
    .delete()
    .eq("id", staffId)
    .eq("salon_id", salon.id);

  if (deleteError) {
    console.error("staff 削除エラー:", deleteError);
    Sentry.captureException(new Error(`staff削除エラー: ${deleteError.message}`), { tags: { feature: "staff-delete" } });
    return { error: `削除に失敗しました: ${deleteError.message}` };
  }

  return { success: true };
}

/**
 * スタッフ情報更新（名前・権限）
 * オーナーのみ実行可能。オーナー権限への昇格は不可。
 */
export async function updateStaff(
  staffId: string,
  name: string,
  role: "manager" | "staff"
) {
  const { user, salon, staff, supabase } = await getAuthAndSalon();

  if (!user || !salon) {
    return { error: "認証エラー" };
  }

  if (staff && staff.role !== "owner") {
    return { error: "スタッフの編集はオーナーのみ実行できます" };
  }

  // オーナー権限への昇格を防止（型でも制限しているが二重チェック）
  if (role !== "manager" && role !== "staff") {
    return { error: "無効な権限です" };
  }

  // 対象がオーナーでないことを確認（オーナーの権限変更を防止）
  const { data: target } = await supabase
    .from("staff")
    .select("role")
    .eq("id", staffId)
    .eq("salon_id", salon.id)
    .single();

  if (!target) {
    return { error: "スタッフが見つかりません" };
  }

  if (target.role === "owner") {
    return { error: "オーナーの権限は変更できません" };
  }

  const { error: updateError } = await supabase
    .from("staff")
    .update({ name, role })
    .eq("id", staffId)
    .eq("salon_id", salon.id);

  if (updateError) {
    console.error("staff 更新エラー:", updateError);
    Sentry.captureException(new Error(`staff更新エラー: ${updateError.message}`), { tags: { feature: "staff-update" } });
    return { error: `更新に失敗しました: ${updateError.message}` };
  }

  return { success: true };
}

/**
 * スタッフ無効化/再有効化
 * オーナーのみ実行可能。オーナーは無効化不可。
 */
export async function toggleStaffActive(staffId: string, isActive: boolean) {
  const { user, salon, staff, supabase } = await getAuthAndSalon();

  if (!user || !salon) {
    return { error: "認証エラー" };
  }

  if (staff && staff.role !== "owner") {
    return { error: "スタッフの状態変更はオーナーのみ実行できます" };
  }

  // 対象スタッフのロールを確認（オーナー無効化を防止）
  const { data: target } = await supabase
    .from("staff")
    .select("role")
    .eq("id", staffId)
    .eq("salon_id", salon.id)
    .single();

  if (!target) {
    return { error: "スタッフが見つかりません" };
  }

  if (!isActive && target.role === "owner") {
    return { error: "オーナーを無効化することはできません" };
  }

  const { error: updateError } = await supabase
    .from("staff")
    .update({ is_active: isActive })
    .eq("id", staffId)
    .eq("salon_id", salon.id);

  if (updateError) {
    console.error("staff 状態更新エラー:", updateError);
    Sentry.captureException(new Error(`staff状態更新エラー: ${updateError.message}`), { tags: { feature: "staff-toggle" } });
    return { error: `状態変更に失敗しました: ${updateError.message}` };
  }

  return { success: true };
}
