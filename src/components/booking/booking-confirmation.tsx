"use client";

type Menu = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
};

type Props = {
  selectedMenus: Menu[];
  date: string;
  time: string;
  totalDuration: number;
  lastName: string;
  firstName: string;
  phone: string;
  memo: string;
};

/** "YYYY-MM-DD" → "M月D日（曜日）" */
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${m}月${d}日（${days[date.getDay()]}）`;
}

export function BookingConfirmation({
  selectedMenus,
  date,
  time,
  totalDuration,
  lastName,
  firstName,
  phone,
  memo,
}: Props) {
  const totalPrice = selectedMenus.reduce((s, m) => s + (m.price ?? 0), 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-light">
        以下の内容でよろしいですか？
      </p>

      <div className="bg-surface border border-border rounded-xl divide-y divide-border">
        {/* メニュー */}
        <div className="p-4 space-y-2">
          <p className="text-xs text-text-light font-medium">メニュー</p>
          {selectedMenus.map((menu) => (
            <div key={menu.id} className="flex items-center justify-between text-sm">
              <span>{menu.name}（{menu.duration_minutes}分）</span>
              <span className="font-medium">&yen;{menu.price?.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-sm font-medium">合計 {totalDuration}分</span>
            <span className="font-bold text-accent">&yen;{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* 日時 */}
        <div className="p-4">
          <p className="text-xs text-text-light font-medium mb-1">日時</p>
          <p className="text-sm font-medium">{formatDate(date)} {time}〜</p>
        </div>

        {/* お客様情報 */}
        <div className="p-4 space-y-1">
          <p className="text-xs text-text-light font-medium mb-1">お客様情報</p>
          <p className="text-sm">{lastName} {firstName}</p>
          <p className="text-sm text-text-light">{phone}</p>
          {memo && <p className="text-sm text-text-light mt-1">{memo}</p>}
        </div>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-3">
        <p className="text-xs text-text-light leading-relaxed">
          「予約する」ボタンを押すと予約リクエストが送信されます。
          サロンからの確認をお待ちください。
        </p>
      </div>
    </div>
  );
}
