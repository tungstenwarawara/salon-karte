/**
 * LP共通の改行ユーティリティクラス
 *
 * 日本語の見出し・本文で漢字途中の不自然な切れ目を抑制する。
 * - 見出し系: text-balance で各行の長さを均等化
 * - 本文系: text-pretty で末尾の孤立行を抑制
 * - 共通: [word-break:auto-phrase] で文節境界を優先
 */

export const WRAP_HEADING = "text-balance [word-break:auto-phrase]";
export const WRAP_BODY = "text-pretty [word-break:auto-phrase]";
