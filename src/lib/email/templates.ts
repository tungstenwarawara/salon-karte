// メールテンプレート（HTML）

// 曜日の日本語マッピング
const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = DAY_NAMES[d.getUTCDay()];
  return `${month}月${day}日（${dow}）`;
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

// 共通のメールレイアウト
function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f1ed;font-family:'Hiragino Sans','Noto Sans JP',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ed;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
${body}
</table>
<p style="margin:24px 0 0;font-size:12px;color:#888;">このメールはサロンカルテから自動送信されています</p>
</td></tr>
</table>
</body>
</html>`;
}

// 予約内容ブロック（各テンプレートで共通利用）
function bookingDetailsBlock(date: string, time: string, menus: string, duration?: number): string {
  const durationText = duration ? `（${duration}分）` : "";
  return `
  <table width="100%" style="background:#f9f7f5;border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:16px;">
    <p style="margin:0 0 12px;font-size:12px;color:#888;font-weight:bold;">予約内容</p>
    <p style="margin:0 0 8px;font-size:14px;color:#333;"><strong>日時:</strong> ${date} ${time}〜${durationText}</p>
    <p style="margin:0;font-size:14px;color:#333;"><strong>メニュー:</strong> ${menus}</p>
  </td></tr>
  </table>`;
}

type BookingInfo = {
  customerName: string;
  appointmentDate: string;
  startTime: string;
  menuNames: string[];
  totalDuration: number;
  salonName: string;
  salonPhone?: string | null;
  cancelUrl?: string;
  changeUrl?: string;
};

// 顧客向け: 予約確認メール
export function buildCustomerConfirmationEmail(info: BookingInfo): {
  subject: string;
  html: string;
} {
  const date = formatDate(info.appointmentDate);
  const time = formatTime(info.startTime);
  const menus = info.menuNames.join("、");

  const actionButtons = info.cancelUrl
    ? `<div style="margin:24px 0;text-align:center;">
        ${info.changeUrl ? `<a href="${info.changeUrl}" style="display:inline-block;background:#c4956a;color:#ffffff;font-size:13px;font-weight:bold;padding:10px 24px;border-radius:8px;text-decoration:none;margin-right:8px;">予約を変更する</a>` : ""}
        <a href="${info.cancelUrl}" style="display:inline-block;background:#f5f5f5;color:#666;font-size:13px;padding:10px 24px;border-radius:8px;text-decoration:none;border:1px solid #ddd;">キャンセルする</a>
      </div>`
    : `<div style="margin:24px 0;padding:16px;background:#fff8f0;border-radius:12px;border:1px solid #f0e6d8;">
        <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
          ${info.salonPhone ? `キャンセル・変更はサロンへ直接ご連絡ください。<br>電話番号: ${info.salonPhone}` : "キャンセル・変更はサロンへ直接ご連絡ください。"}
        </p>
      </div>`;

  const body = `
<tr><td style="padding:32px 24px 0;text-align:center;">
  <h1 style="margin:0;font-size:20px;color:#333;">ご予約を受け付けました</h1>
</td></tr>
<tr><td style="padding:24px;">
  <p style="margin:0 0 16px;font-size:14px;color:#333;">${info.customerName}様</p>
  <p style="margin:0 0 24px;font-size:14px;color:#333;line-height:1.6;">
    ご予約ありがとうございます。<br>以下の内容で予約を受け付けました。
  </p>
  ${bookingDetailsBlock(date, time, menus, info.totalDuration)}
  ${actionButtons}
  <p style="margin:0;font-size:14px;color:#333;">ご来店をお待ちしております。</p>
  <p style="margin:8px 0 0;font-size:14px;color:#333;font-weight:bold;">${info.salonName}</p>
</td></tr>`;

  return {
    subject: `【${info.salonName}】ご予約を受け付けました`,
    html: wrapHtml(body),
  };
}

type OwnerNotificationInfo = {
  customerName: string;
  isNewCustomer: boolean;
  appointmentDate: string;
  startTime: string;
  menuNames: string[];
  totalDuration: number;
  customerEmail: string;
  customerPhone: string;
  memo?: string | null;
  salonName: string;
};

// オーナー向け: 新規Web予約通知メール
export function buildOwnerNotificationEmail(info: OwnerNotificationInfo): {
  subject: string;
  html: string;
} {
  const date = formatDate(info.appointmentDate);
  const time = formatTime(info.startTime);
  const menus = info.menuNames.join("、");
  const badge = info.isNewCustomer
    ? '<span style="display:inline-block;background:#e8f5e9;color:#2e7d32;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:8px;margin-left:8px;">新規</span>'
    : '<span style="display:inline-block;background:#e3f2fd;color:#1565c0;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:8px;margin-left:8px;">既存</span>';

  const memoRow = info.memo
    ? `<p style="margin:8px 0 0;font-size:14px;color:#333;"><strong>メモ:</strong> ${info.memo}</p>`
    : "";

  const body = `
<tr><td style="padding:32px 24px 0;text-align:center;">
  <h1 style="margin:0;font-size:20px;color:#333;">Web予約が入りました</h1>
</td></tr>
<tr><td style="padding:24px;">
  <table width="100%" style="background:#f9f7f5;border-radius:12px;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:16px;">
    <p style="margin:0 0 12px;font-size:12px;color:#888;font-weight:bold;">お客様情報</p>
    <p style="margin:0 0 8px;font-size:16px;color:#333;font-weight:bold;">
      ${info.customerName}様${badge}
    </p>
    <p style="margin:0 0 4px;font-size:13px;color:#666;">電話: ${info.customerPhone}</p>
    <p style="margin:0;font-size:13px;color:#666;">メール: ${info.customerEmail}</p>
  </td></tr>
  </table>
  <table width="100%" style="background:#f9f7f5;border-radius:12px;margin-top:12px;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:16px;">
    <p style="margin:0 0 12px;font-size:12px;color:#888;font-weight:bold;">予約内容</p>
    <p style="margin:0 0 8px;font-size:14px;color:#333;"><strong>日時:</strong> ${date} ${time}〜（${info.totalDuration}分）</p>
    <p style="margin:0;font-size:14px;color:#333;"><strong>メニュー:</strong> ${menus}</p>
    ${memoRow}
  </td></tr>
  </table>
  <p style="margin:24px 0 0;font-size:13px;color:#888;text-align:center;">
    サロンカルテのダッシュボードで詳細を確認できます
  </p>
</td></tr>`;

  return {
    subject: `【Web予約】${info.customerName}様（${date} ${time}）`,
    html: wrapHtml(body),
  };
}

type OwnerCancelNotificationInfo = {
  customerName: string;
  appointmentDate: string;
  startTime: string;
  menuNames: string[];
  salonName: string;
};

// オーナー向け: 予約キャンセル通知メール
export function buildOwnerCancelNotificationEmail(info: OwnerCancelNotificationInfo): {
  subject: string;
  html: string;
} {
  const date = formatDate(info.appointmentDate);
  const time = formatTime(info.startTime);
  const menus = info.menuNames.join("、");

  const body = `
<tr><td style="padding:32px 24px 0;text-align:center;">
  <h1 style="margin:0;font-size:20px;color:#c62828;">予約がキャンセルされました</h1>
</td></tr>
<tr><td style="padding:24px;">
  <p style="margin:0 0 16px;font-size:14px;color:#333;">
    お客様がWeb予約をキャンセルしました。
  </p>
  <table width="100%" style="background:#fef2f2;border-radius:12px;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:16px;">
    <p style="margin:0 0 12px;font-size:12px;color:#888;font-weight:bold;">キャンセル内容</p>
    <p style="margin:0 0 8px;font-size:16px;color:#333;font-weight:bold;">${info.customerName}様</p>
    <p style="margin:0 0 8px;font-size:14px;color:#333;"><strong>日時:</strong> ${date} ${time}〜</p>
    <p style="margin:0;font-size:14px;color:#333;"><strong>メニュー:</strong> ${menus}</p>
  </td></tr>
  </table>
  <p style="margin:24px 0 0;font-size:13px;color:#888;text-align:center;">
    サロンカルテのダッシュボードで詳細を確認できます
  </p>
</td></tr>`;

  return {
    subject: `【キャンセル】${info.customerName}様（${date} ${time}）`,
    html: wrapHtml(body),
  };
}

type CustomerCancelConfirmationInfo = {
  customerName: string;
  appointmentDate: string;
  startTime: string;
  menuNames: string[];
  salonName: string;
  salonPhone?: string | null;
  bookingUrl?: string;
};

// 顧客向け: キャンセル完了メール
export function buildCustomerCancelConfirmationEmail(info: CustomerCancelConfirmationInfo): {
  subject: string;
  html: string;
} {
  const date = formatDate(info.appointmentDate);
  const time = formatTime(info.startTime);
  const menus = info.menuNames.join("、");

  const rebookSection = info.bookingUrl
    ? `<div style="margin:24px 0;text-align:center;">
        <a href="${info.bookingUrl}" style="display:inline-block;background:#c4956a;color:#ffffff;font-size:14px;font-weight:bold;padding:12px 32px;border-radius:12px;text-decoration:none;">再度予約する</a>
      </div>`
    : "";

  const body = `
<tr><td style="padding:32px 24px 0;text-align:center;">
  <h1 style="margin:0;font-size:20px;color:#333;">予約をキャンセルしました</h1>
</td></tr>
<tr><td style="padding:24px;">
  <p style="margin:0 0 16px;font-size:14px;color:#333;">${info.customerName}様</p>
  <p style="margin:0 0 24px;font-size:14px;color:#333;line-height:1.6;">
    以下の予約をキャンセルいたしました。
  </p>
  <table width="100%" style="background:#f9f7f5;border-radius:12px;padding:16px;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:16px;">
    <p style="margin:0 0 12px;font-size:12px;color:#888;font-weight:bold;">キャンセル済みの予約</p>
    <p style="margin:0 0 8px;font-size:14px;color:#333;"><strong>日時:</strong> ${date} ${time}〜</p>
    <p style="margin:0;font-size:14px;color:#333;"><strong>メニュー:</strong> ${menus}</p>
  </td></tr>
  </table>
  ${rebookSection}
  <p style="margin:16px 0 0;font-size:14px;color:#333;font-weight:bold;">${info.salonName}</p>
</td></tr>`;

  return {
    subject: `【${info.salonName}】予約をキャンセルしました`,
    html: wrapHtml(body),
  };
}

type ReminderEmailInfo = {
  customerName: string;
  appointmentDate: string;
  startTime: string;
  menuNames: string[];
  salonName: string;
  salonPhone?: string | null;
  cancelUrl?: string;
  changeUrl?: string;
};

// 顧客向け: 予約リマインドメール（前日送信）
export function buildCustomerReminderEmail(info: ReminderEmailInfo): {
  subject: string;
  html: string;
} {
  const date = formatDate(info.appointmentDate);
  const time = formatTime(info.startTime);
  const menus = info.menuNames.join("、");

  const cancelSection = info.cancelUrl
    ? `<div style="margin:16px 0;text-align:center;">
        ${info.changeUrl ? `<a href="${info.changeUrl}" style="font-size:12px;color:#c4956a;text-decoration:underline;margin-right:16px;">変更はこちら</a>` : ""}
        <a href="${info.cancelUrl}" style="font-size:12px;color:#999;text-decoration:underline;">キャンセルはこちら</a>
      </div>`
    : "";

  const body = `
<tr><td style="padding:32px 24px 0;text-align:center;">
  <h1 style="margin:0;font-size:20px;color:#333;">明日のご予約のお知らせ</h1>
</td></tr>
<tr><td style="padding:24px;">
  <p style="margin:0 0 16px;font-size:14px;color:#333;">${info.customerName}様</p>
  <p style="margin:0 0 24px;font-size:14px;color:#333;line-height:1.6;">
    明日のご予約をお知らせいたします。
  </p>
  ${bookingDetailsBlock(date, time, menus)}
  ${cancelSection}
  <p style="margin:16px 0 0;font-size:14px;color:#333;">ご来店をお待ちしております。</p>
  <p style="margin:8px 0 0;font-size:14px;color:#333;font-weight:bold;">${info.salonName}</p>
</td></tr>`;

  return {
    subject: `【${info.salonName}】明日のご予約のお知らせ`,
    html: wrapHtml(body),
  };
}

type CustomerChangeConfirmationInfo = {
  customerName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  newMenuNames: string[];
  newTotalDuration: number;
  salonName: string;
  salonPhone?: string | null;
};

// 顧客向け: 予約変更完了メール
export function buildCustomerChangeConfirmationEmail(info: CustomerChangeConfirmationInfo): {
  subject: string;
  html: string;
} {
  const oldDateFmt = formatDate(info.oldDate);
  const oldTimeFmt = formatTime(info.oldTime);
  const newDateFmt = formatDate(info.newDate);
  const newTimeFmt = formatTime(info.newTime);
  const menus = info.newMenuNames.join("、");

  const body = `
<tr><td style="padding:32px 24px 0;text-align:center;">
  <h1 style="margin:0;font-size:20px;color:#333;">予約を変更しました</h1>
</td></tr>
<tr><td style="padding:24px;">
  <p style="margin:0 0 16px;font-size:14px;color:#333;">${info.customerName}様</p>
  <p style="margin:0 0 24px;font-size:14px;color:#333;line-height:1.6;">
    ご予約の変更を受け付けました。
  </p>
  <table width="100%" style="background:#f9f7f5;border-radius:12px;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:16px;">
    <p style="margin:0 0 12px;font-size:12px;color:#888;font-weight:bold;">変更前</p>
    <p style="margin:0;font-size:14px;color:#999;text-decoration:line-through;">${oldDateFmt} ${oldTimeFmt}〜</p>
  </td></tr>
  </table>
  <div style="text-align:center;padding:8px 0;font-size:16px;color:#c4956a;">↓</div>
  ${bookingDetailsBlock(newDateFmt, newTimeFmt, menus, info.newTotalDuration)}
  <p style="margin:24px 0 0;font-size:14px;color:#333;">ご来店をお待ちしております。</p>
  <p style="margin:8px 0 0;font-size:14px;color:#333;font-weight:bold;">${info.salonName}</p>
</td></tr>`;

  return {
    subject: `【${info.salonName}】予約を変更しました`,
    html: wrapHtml(body),
  };
}

type OwnerChangeNotificationInfo = {
  customerName: string;
  oldDate: string;
  oldTime: string;
  oldMenuName: string | null;
  newDate: string;
  newTime: string;
  newMenuNames: string[];
  salonName: string;
};

// オーナー向け: 予約変更通知メール
export function buildOwnerChangeNotificationEmail(info: OwnerChangeNotificationInfo): {
  subject: string;
  html: string;
} {
  const oldDateFmt = formatDate(info.oldDate);
  const oldTimeFmt = formatTime(info.oldTime);
  const newDateFmt = formatDate(info.newDate);
  const newTimeFmt = formatTime(info.newTime);
  const newMenus = info.newMenuNames.join("、");

  const body = `
<tr><td style="padding:32px 24px 0;text-align:center;">
  <h1 style="margin:0;font-size:20px;color:#c4956a;">予約が変更されました</h1>
</td></tr>
<tr><td style="padding:24px;">
  <p style="margin:0 0 16px;font-size:14px;color:#333;">
    お客様がWeb予約を変更しました。
  </p>
  <table width="100%" style="background:#f9f7f5;border-radius:12px;" cellpadding="0" cellspacing="0">
  <tr><td style="padding:16px;">
    <p style="margin:0 0 8px;font-size:16px;color:#333;font-weight:bold;">${info.customerName}様</p>
    <p style="margin:0 0 12px;font-size:12px;color:#888;font-weight:bold;">変更前</p>
    <p style="margin:0 0 4px;font-size:14px;color:#999;text-decoration:line-through;">
      ${oldDateFmt} ${oldTimeFmt}〜 ${info.oldMenuName ? `/ ${info.oldMenuName}` : ""}
    </p>
    <p style="margin:12px 0 0;font-size:12px;color:#888;font-weight:bold;">変更後</p>
    <p style="margin:4px 0 0;font-size:14px;color:#333;font-weight:bold;">
      ${newDateFmt} ${newTimeFmt}〜 / ${newMenus}
    </p>
  </td></tr>
  </table>
  <p style="margin:24px 0 0;font-size:13px;color:#888;text-align:center;">
    サロンカルテのダッシュボードで詳細を確認できます
  </p>
</td></tr>`;

  return {
    subject: `【変更】${info.customerName}様（${newDateFmt} ${newTimeFmt}）`,
    html: wrapHtml(body),
  };
}
