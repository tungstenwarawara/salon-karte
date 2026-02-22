type MonthlyRepeat = {
  month: number;
  new_customers: number;
  returning_customers: number;
};

type Props = {
  data: MonthlyRepeat[];
  year: number;
  currentYear: number;
  currentMonth: number;
};

const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function RepeatChart({ data, year, currentYear, currentMonth }: Props) {
  const visibleData = data.filter(
    (m) => !(year === currentYear && m.month - 1 > currentMonth - 1)
  );
  const maxTotal = Math.max(...visibleData.map((m) => m.new_customers + m.returning_customers), 1);

  const hasData = visibleData.some((m) => m.new_customers + m.returning_customers > 0);
  if (!hasData) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center text-text-light">
        <p className="text-sm">{year}年の来店データがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-text-light uppercase tracking-wide">新規/リピーター推移</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400" /><span className="text-[10px] text-text-light">新規</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-accent" /><span className="text-[10px] text-text-light">リピーター</span></div>
        </div>
      </div>

      {/* 棒グラフ */}
      <div className="flex items-end gap-1" style={{ height: 148 }}>
        {visibleData.map((m) => {
          const total = m.new_customers + m.returning_customers;
          const barHeight = total > 0 ? (total / maxTotal) * 148 : 0;
          const newH = total > 0 ? (m.new_customers / total) * barHeight : 0;
          const retH = barHeight - newH;
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full">
              {total > 0 && (
                <span className="text-[9px] text-text-light mb-0.5">{total}</span>
              )}
              <div className="w-full flex flex-col" style={{ height: barHeight }}>
                <div className="bg-accent rounded-t relative flex items-center justify-center" style={{ height: retH, minHeight: retH > 0 ? 2 : 0 }}>
                  {m.returning_customers > 0 && retH >= 16 && (
                    <span className="text-[9px] text-white font-medium">{m.returning_customers}</span>
                  )}
                </div>
                <div className="bg-blue-400 rounded-b relative flex items-center justify-center" style={{ height: newH, minHeight: newH > 0 ? 2 : 0 }}>
                  {m.new_customers > 0 && newH >= 16 && (
                    <span className="text-[9px] text-white font-medium">{m.new_customers}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 月ラベル */}
      <div className="flex gap-1">
        {visibleData.map((m) => (
          <div key={m.month} className="flex-1 text-center text-[9px] text-text-light">
            {MONTH_LABELS[m.month - 1]}
          </div>
        ))}
      </div>
    </div>
  );
}
