/**
 * Supabase Auth エラーメッセージの日本語翻訳
 * Supabase はエラーメッセージを英語で返すため、ユーザー向けに日本語に変換する
 */

const AUTH_ERROR_TRANSLATIONS: Record<string, string> = {
  // パスワード関連
  "New password should be different from the old password.":
    "前回と同じパスワードは使用できません。別のパスワードを入力してください。",
  "Password should be at least 6 characters.":
    "パスワードは6文字以上で入力してください。",
  "Password should be at least 8 characters.":
    "パスワードは8文字以上で入力してください。",
  // Supabase の Password requirements 機能のメッセージ（pwned/strength系）
  "Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789.":
    "パスワードは英小文字・英大文字・数字をそれぞれ1文字以上含めてください。",
  "weak_password":
    "パスワードが弱すぎます。8文字以上で、英小文字・英大文字・数字をそれぞれ1文字以上含めてください。",
  "Password is known to be weak and easy to guess, please choose a different one.":
    "推測されやすいパスワードです。別のパスワードを入力してください。",
  "Auth session missing!":
    "認証セッションが見つかりません。メールのリンクをもう一度クリックしてください。",

  // メール・認証関連
  "Invalid login credentials":
    "メールアドレスまたはパスワードが正しくありません。",
  "Email not confirmed":
    "メールアドレスが未確認です。確認メールのリンクをクリックしてください。",
  "User already registered":
    "このメールアドレスは既に登録されています。",
  "Email rate limit exceeded":
    "メール送信の上限に達しました。しばらく時間をおいてから再試行してください。",
  "For security purposes, you can only request this once every 60 seconds":
    "セキュリティのため、60秒に1回のみリクエストできます。しばらくお待ちください。",

  // トークン・セッション関連
  "Token has expired or is invalid":
    "リンクの有効期限が切れています。もう一度メールを送信してください。",
  "User not found":
    "ユーザーが見つかりません。",

  // レート制限
  "Request rate limit reached":
    "リクエスト数が上限に達しました。しばらく時間をおいてから再試行してください。",
};

/**
 * Supabase Auth のエラーメッセージを日本語に変換する
 * 既知のメッセージは翻訳、未知のメッセージは汎用メッセージを返す
 */
export function translateAuthError(message: string): string {
  // 完全一致
  if (AUTH_ERROR_TRANSLATIONS[message]) {
    return AUTH_ERROR_TRANSLATIONS[message];
  }

  // 部分一致（Supabaseがバージョンで微妙に文言を変えることがあるため）
  for (const [key, value] of Object.entries(AUTH_ERROR_TRANSLATIONS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // 未知のエラー: 汎用メッセージ + 元のメッセージをログ用に保持
  console.warn("未翻訳の認証エラー:", message);
  return "エラーが発生しました。しばらく時間をおいてから再試行してください。";
}
