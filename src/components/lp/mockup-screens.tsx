/** LP用モックアプリ画面 — 実データ不要のプログラマティック描画 */

/** カルテ記録画面 */
export function MockKarteScreen() {
  return (
    <div className="p-3 space-y-2.5 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-text">カルテ新規作成</span>
        <span className="text-accent text-[9px]">3/6</span>
      </div>
      {/* 顧客名 */}
      <div className="bg-white rounded-xl p-2.5 border border-border">
        <span className="text-[9px] text-text-light">お客様</span>
        <div className="font-bold text-sm mt-0.5">田中 美咲 様</div>
      </div>
      {/* メニュー */}
      <div className="bg-white rounded-xl p-2.5 border border-border space-y-1.5">
        <span className="font-bold text-text-light">施術メニュー</span>
        <div className="flex justify-between items-center py-1 border-b border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>カット+カラー</span>
          </div>
          <span className="font-medium">¥12,000</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>トリートメント</span>
          </div>
          <span className="font-medium">¥3,000</span>
        </div>
      </div>
      {/* 写真 */}
      <div className="bg-white rounded-xl p-2.5 border border-border">
        <span className="font-bold text-text-light">施術写真</span>
        <div className="flex gap-2 mt-1.5">
          <div className="flex-1 aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <span className="text-[8px] text-amber-600 font-medium">Before</span>
          </div>
          <div className="flex-1 aspect-square rounded-lg bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center">
            <span className="text-[8px] text-accent font-medium">After</span>
          </div>
        </div>
      </div>
      {/* メモ */}
      <div className="bg-white rounded-xl p-2.5 border border-border">
        <span className="font-bold text-text-light">メモ</span>
        <p className="mt-1 text-text leading-relaxed">前回より明るめカラー。次回パーマも検討中。</p>
      </div>
      {/* 合計 */}
      <div className="bg-accent text-white rounded-xl p-3 text-center">
        <span className="text-[9px] opacity-80">合計金額</span>
        <div className="text-lg font-bold">¥15,000</div>
      </div>
    </div>
  );
}

/** 予約管理画面 */
export function MockAppointmentScreen() {
  const slots = [
    { time: "10:00", name: "田中 美咲", menu: "カット+カラー", color: "bg-accent/15 border-accent/30 text-accent" },
    { time: "13:00", name: "佐藤 花", menu: "トリートメント", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { time: "15:30", name: "鈴木 あい", menu: "パーマ", color: "bg-violet-50 border-violet-200 text-violet-700" },
    { time: "17:00", name: "", menu: "", color: "" },
  ];
  return (
    <div className="p-3 space-y-2.5 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-text">予約管理</span>
        <div className="flex items-center gap-1">
          <ChevronIcon dir="left" />
          <span className="text-accent font-bold text-[11px]">3月6日(木)</span>
          <ChevronIcon dir="right" />
        </div>
      </div>
      {/* タイムライン */}
      <div className="space-y-1.5">
        {slots.map((s) => (
          <div key={s.time} className={`rounded-xl p-2.5 border ${s.name ? s.color : "bg-white border-border border-dashed"}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold w-8 text-[11px]">{s.time}</span>
              {s.name ? (
                <div className="flex-1">
                  <div className="font-bold text-[11px]">{s.name} 様</div>
                  <div className="text-[9px] opacity-70">{s.menu}</div>
                </div>
              ) : (
                <span className="text-text-light italic">空き</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* LINE通知バッジ */}
      <div className="bg-[#06C755]/10 rounded-xl p-2.5 border border-[#06C755]/20 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
            <path d="M12 2C6.48 2 2 5.92 2 10.66c0 2.78 1.56 5.24 4 6.86v3.48l3.14-1.72c.92.26 1.88.4 2.86.4 5.52 0 10-3.92 10-8.68S17.52 2 12 2z" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-[#06C755]">LINE通知 ON</div>
          <div className="text-[9px] text-text-light">予約確認・前日リマインド自動送信</div>
        </div>
      </div>
      {/* 追加ボタン */}
      <div className="bg-accent text-white rounded-xl p-2.5 text-center font-bold text-[11px]">
        + 予約を登録
      </div>
    </div>
  );
}

/** 顧客詳細画面 */
export function MockCustomerScreen() {
  return (
    <div className="p-3 space-y-2.5 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-text">顧客詳細</span>
      </div>
      {/* プロフィール */}
      <div className="bg-white rounded-xl p-3 border border-border text-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/30 to-accent/60 mx-auto mb-2 flex items-center justify-center">
          <span className="text-white font-bold text-sm">田</span>
        </div>
        <div className="font-bold text-sm">田中 美咲 様</div>
        <div className="text-[9px] text-text-light mt-0.5">最終来店: 3/1 ・ 常連</div>
      </div>
      {/* 統計カード */}
      <div className="grid grid-cols-3 gap-1.5">
        <StatMini label="来店回数" value="12回" />
        <StatMini label="累計売上" value="¥156K" accent />
        <StatMini label="来店間隔" value="21日" />
      </div>
      {/* 施術履歴 */}
      <div className="bg-white rounded-xl p-2.5 border border-border space-y-1.5">
        <span className="font-bold text-text-light">施術履歴</span>
        {[
          { date: "3/1", menu: "カット+カラー", price: "¥12,000" },
          { date: "2/15", menu: "トリートメント", price: "¥3,000" },
          { date: "2/1", menu: "カット", price: "¥5,500" },
        ].map((h) => (
          <div key={h.date} className="flex items-center py-1 border-b border-border/50 last:border-0">
            <span className="text-text-light w-7">{h.date}</span>
            <span className="flex-1 font-medium">{h.menu}</span>
            <span className="font-medium">{h.price}</span>
          </div>
        ))}
      </div>
      {/* メモ・好み */}
      <div className="bg-white rounded-xl p-2.5 border border-border">
        <span className="font-bold text-text-light">好み・メモ</span>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {["明るめカラー", "敏感肌", "パーマ検討中"].map((t) => (
            <span key={t} className="bg-accent/10 text-accent rounded-full px-2 py-0.5 text-[9px] font-medium">{t}</span>
          ))}
        </div>
      </div>
      {/* 回数券 */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl p-2.5 border border-accent/20">
        <div className="flex justify-between items-center">
          <span className="font-bold text-accent">ヘッドスパ回数券</span>
          <span className="text-accent font-bold text-[11px]">残3回</span>
        </div>
        <div className="flex gap-0.5 mt-1">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= 2 ? "bg-accent" : "bg-accent/20"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** 売上レポート画面 */
export function MockSalesScreen() {
  const months = [
    { label: "10月", h: 45 },
    { label: "11月", h: 55 },
    { label: "12月", h: 70 },
    { label: "1月", h: 50 },
    { label: "2月", h: 65 },
    { label: "3月", h: 80, current: true },
  ];
  return (
    <div className="p-3 space-y-2.5 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-text">売上レポート</span>
        <span className="text-accent text-[9px] font-medium">2026年3月</span>
      </div>
      {/* メイン指標 */}
      <div className="bg-white rounded-xl p-3 border border-border text-center">
        <span className="text-text-light">月間売上</span>
        <div className="text-2xl font-bold text-text mt-0.5">¥482,000</div>
        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 text-[9px] font-medium mt-1">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
          前月比 +12.3%
        </div>
      </div>
      {/* バーチャート */}
      <div className="bg-white rounded-xl p-3 border border-border">
        <span className="font-bold text-text-light">月別推移</span>
        <div className="flex items-end justify-between gap-1.5 mt-2 h-20">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md transition-all ${m.current ? "bg-accent" : "bg-accent/25"}`}
                style={{ height: `${m.h}%` }}
              />
              <span className={`text-[8px] ${m.current ? "text-accent font-bold" : "text-text-light"}`}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* 内訳 */}
      <div className="bg-white rounded-xl p-2.5 border border-border space-y-1.5">
        <span className="font-bold text-text-light">売上内訳</span>
        <BreakdownRow label="施術" amount="¥398,000" pct={83} color="bg-accent" />
        <BreakdownRow label="物販" amount="¥84,000" pct={17} color="bg-emerald-400" />
      </div>
      {/* 確定申告 */}
      <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-200 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <div>
          <div className="font-bold text-blue-700 text-[10px]">確定申告レポート</div>
          <div className="text-[9px] text-blue-600">CSV出力でかんたん申告</div>
        </div>
      </div>
    </div>
  );
}

/* ── 内部ヘルパー ── */

function StatMini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-lg p-2 text-center border border-border">
      <div className="text-[8px] text-text-light">{label}</div>
      <div className={`text-[11px] font-bold ${accent ? "text-accent" : "text-text"}`}>{value}</div>
    </div>
  );
}

function BreakdownRow({ label, amount, pct, color }: { label: string; amount: string; pct: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="font-medium">{amount}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg className="w-3.5 h-3.5 text-text-light" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === "left" ? "M15.75 19.5 8.25 12l7.5-7.5" : "m8.25 4.5 7.5 7.5-7.5 7.5"} />
    </svg>
  );
}
