"use server";

import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthAndSalon } from "@/lib/supabase/auth-helpers";

/**
 * アカウント削除（退会）
 * オーナーのみ実行可能。サロンに紐づく全データを完全削除する。
 *
 * 削除順:
 * 1. Storage写真を一括削除
 * 2. auth.users から削除（ログイン不可に）
 * 3. salons レコード削除（CASCADE で全子テーブル削除）
 */
export async function deleteAccount(confirmText: string) {
  if (confirmText !== "削除") {
    return { error: "確認テキストが一致しません" };
  }

  const { user, salon, staff } = await getAuthAndSalon();

  if (!user || !salon) {
    return { error: "認証エラー" };
  }

  // オーナー権限チェック
  if (staff && staff.role !== "owner") {
    return { error: "アカウントの削除はオーナーのみ実行できます" };
  }

  const adminClient = createAdminClient();

  // 1. Storage写真を一括削除（失敗してもDB削除は続行）
  try {
    const { data: files } = await adminClient.storage
      .from("treatment-photos")
      .list(salon.id, { limit: 1000 });

    if (files && files.length > 0) {
      // サブフォルダ内のファイルも取得して削除
      const allPaths: string[] = [];
      for (const item of files) {
        if (item.id === null) {
          // フォルダの場合、中身を取得
          const { data: subFiles } = await adminClient.storage
            .from("treatment-photos")
            .list(`${salon.id}/${item.name}`, { limit: 1000 });
          if (subFiles) {
            for (const sub of subFiles) {
              allPaths.push(`${salon.id}/${item.name}/${sub.name}`);
            }
          }
        } else {
          allPaths.push(`${salon.id}/${item.name}`);
        }
      }

      if (allPaths.length > 0) {
        await adminClient.storage
          .from("treatment-photos")
          .remove(allPaths);
      }
    }
  } catch (storageError) {
    // Storage削除失敗はログのみ（孤立ファイルは許容）
    console.error("Storage削除エラー（続行）:", storageError);
    Sentry.captureException(storageError, {
      tags: { feature: "account-delete", step: "storage" },
    });
  }

  // 2. auth.users から削除
  const { error: authDeleteError } =
    await adminClient.auth.admin.deleteUser(user.id);

  if (authDeleteError) {
    console.error("auth.users 削除エラー:", authDeleteError);
    Sentry.captureException(authDeleteError, {
      tags: { feature: "account-delete", step: "auth" },
    });
    return { error: `アカウント削除に失敗しました: ${authDeleteError.message}` };
  }

  // 3. salons レコード削除（CASCADE で全子テーブル削除）
  // auth.users 削除後はRLSが効かないため、admin clientで実行
  const { error: salonDeleteError } = await adminClient
    .from("salons")
    .delete()
    .eq("id", salon.id);

  if (salonDeleteError) {
    console.error("salon 削除エラー:", salonDeleteError);
    Sentry.captureException(salonDeleteError, {
      tags: { feature: "account-delete", step: "salon" },
    });
    return { error: `データ削除に失敗しました: ${salonDeleteError.message}` };
  }

  return { success: true };
}
