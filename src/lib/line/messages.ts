// 曜日の日本語マッピング
const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(dateStr: string): string {
  // dateStr は "YYYY-MM-DD"（JST日付）
  // サーバーがUTCで動作するため、UTC基準で計算して曜日ずれを防止
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = DAY_NAMES[d.getUTCDay()];
  return `${month}月${day}日（${dow}）`;
}

function formatTime(timeStr: string): string {
  // "HH:MM:SS" or "HH:MM" → "HH:MM"
  return timeStr.slice(0, 5);
}

type AppointmentInfo = {
  customerName: string;
  appointmentDate: string;
  startTime: string;
  menuNames: string[];
  salonName: string;
};

// 予約確認メッセージ（予約作成時に即時送信）
export function buildConfirmationMessage(info: AppointmentInfo): { type: string; text: string } {
  const date = formatDate(info.appointmentDate);
  const time = formatTime(info.startTime);
  const menus = info.menuNames.length > 0 ? info.menuNames.join("、") : "未指定";

  return {
    type: "text",
    text: [
      `${info.customerName}様`,
      "",
      "ご予約を承りました。",
      "",
      `日時: ${date} ${time}〜`,
      `メニュー: ${menus}`,
      "",
      "ご来店をお待ちしております。",
      info.salonName,
    ].join("\n"),
  };
}

// リマインドメッセージ（前日通知）
export function buildReminderMessage(info: AppointmentInfo): { type: string; text: string } {
  const date = formatDate(info.appointmentDate);
  const time = formatTime(info.startTime);
  const menus = info.menuNames.length > 0 ? info.menuNames.join("、") : "未指定";

  return {
    type: "text",
    text: [
      `${info.customerName}様`,
      "",
      "明日のご予約のお知らせです。",
      "",
      `日時: ${date} ${time}〜`,
      `メニュー: ${menus}`,
      "",
      `${info.salonName}でお待ちしております。`,
    ].join("\n"),
  };
}
