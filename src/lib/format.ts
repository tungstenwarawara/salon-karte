const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

/**
 * ISO日付文字列を日本語形式にフォーマット
 * "2025-01-15" → "2025年1月15日（水）"
 */
export function formatDateJa(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = DAY_NAMES[date.getDay()];
  return `${y}年${m}月${d}日（${dow}）`;
}

/**
 * ISO日付文字列を短い日本語形式にフォーマット（年なし）
 * "2025-01-15" → "1/15（水）"
 */
export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = DAY_NAMES[date.getDay()];
  return `${m}/${d}（${dow}）`;
}

/**
 * ISO日付文字列から相対的な日付表現を返す
 * 今日 → "今日"、昨日 → "昨日"、2日前〜6日前 → "X日前"、それ以上 → "M/D"
 */
export function formatDateRelative(dateStr: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  if (diffDays >= 2 && diffDays <= 6) return `${diffDays}日前`;
  return `${m}/${d}`;
}
