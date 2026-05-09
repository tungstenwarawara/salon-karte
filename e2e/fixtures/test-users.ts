/**
 * アクティベーションフロー用 — フレッシュユーザーのライフサイクル管理
 *
 * 用途:
 * - signup / setup / 初カルテの E2E で「実メール送信を経由せず」に
 *   メール確認済みの新規ユーザーを作成する。
 * - テスト終了時に必ずユーザー + 関連データを削除する。
 *
 * 安全装置:
 * - メールアドレスは `e2e-activation-` プレフィックス + タイムスタンプで一意。
 *   テストサロン (test-salon@salon-karte.dev) や本番アカウントと衝突しない。
 * - 削除時にプレフィックスを再チェック（誤って他ユーザーを消さないため）。
 * - SUPABASE_SERVICE_ROLE_KEY が未設定なら早期エラー（本番認証情報を要求しない）。
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// Playwright のワーカープロセスでも .env.local を確実に読み込む。
// playwright.config.ts 側でも読むが、ワーカー起動時に再読込しないと環境変数が引き継がれないケースがある。
loadEnv({ path: resolve(process.cwd(), ".env.local") });

const ACTIVATION_EMAIL_PREFIX = "e2e-activation-";

let cachedAdmin: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "アクティベーションE2Eには NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です。.env.local を確認してください。",
    );
  }

  cachedAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdmin;
}

/** テスト用に一意なメールアドレスを生成 */
export function generateActivationEmail(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ACTIVATION_EMAIL_PREFIX}${ts}-${rand}@example.test`;
}

export const ACTIVATION_PASSWORD = "E2eActivation2026!";

/**
 * メール確認済みのフレッシュユーザーを作成する。
 * 戻り値の userId は cleanup で使う。
 *
 * email_confirm: true で作るので、ログイン直後に /setup（または /dashboard）に進める。
 */
export async function createConfirmedUser(email: string, password = ACTIVATION_PASSWORD) {
  if (!email.startsWith(ACTIVATION_EMAIL_PREFIX)) {
    throw new Error(
      `安全装置: createConfirmedUser には ${ACTIVATION_EMAIL_PREFIX} で始まるメールのみ許可します。受領: ${email}`,
    );
  }

  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`フレッシュユーザー作成失敗: ${error?.message ?? "unknown"}`);
  }

  return { userId: data.user.id, email, password };
}

/**
 * ユーザー + 関連サロン + staff レコードを削除する。
 * 失敗しても例外は throw せず console.warn に留める（テスト失敗を上書きしない）。
 *
 * 削除順:
 * 1. salons (cascade で staff / customers / records 等もRLS無視で消える想定)
 * 2. auth.users (admin.deleteUser)
 */
export async function cleanupActivationUser(userId: string, email: string) {
  if (!email.startsWith(ACTIVATION_EMAIL_PREFIX)) {
    console.warn(
      `[cleanupActivationUser] ${ACTIVATION_EMAIL_PREFIX} で始まらないメールのため削除をスキップ: ${email}`,
    );
    return;
  }

  const admin = getAdminClient();

  // 関連サロンを削除（cascadeで関連データも削除される想定）
  const { data: salons, error: salonError } = await admin
    .from("salons")
    .select("id")
    .eq("owner_id", userId);

  if (salonError) {
    console.warn(`[cleanupActivationUser] サロン取得失敗: ${salonError.message}`);
  }

  if (salons && salons.length > 0) {
    const { error: deleteSalonError } = await admin
      .from("salons")
      .delete()
      .eq("owner_id", userId);
    if (deleteSalonError) {
      console.warn(
        `[cleanupActivationUser] サロン削除失敗 (${userId}): ${deleteSalonError.message}`,
      );
    }
  }

  // staff レコードも明示削除（cascade されない場合の保険）
  await admin.from("staff").delete().eq("auth_user_id", userId);

  // ユーザー削除
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    console.warn(
      `[cleanupActivationUser] ユーザー削除失敗 (${email}): ${deleteUserError.message}`,
    );
  }
}

/**
 * メールアドレス指定で auth ユーザーを検索して削除する。
 * /api/auth/signup を直接叩いた後のクリーンアップに使用。
 */
export async function cleanupActivationUserByEmail(email: string) {
  if (!email.startsWith(ACTIVATION_EMAIL_PREFIX)) {
    console.warn(
      `[cleanupActivationUserByEmail] ${ACTIVATION_EMAIL_PREFIX} で始まらないメールのため削除をスキップ: ${email}`,
    );
    return;
  }

  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) {
    console.warn(`[cleanupActivationUserByEmail] ユーザー一覧取得失敗: ${error.message}`);
    return;
  }

  const user = data.users.find((u) => u.email === email);
  if (!user) return;
  await cleanupActivationUser(user.id, email);
}
