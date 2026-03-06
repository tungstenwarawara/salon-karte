/** LP用モックアプリ画面 — 実際のアプリUIに忠実に再現 */

/** ダッシュボード画面（ヒーロー用） */
export function MockDashboardScreen() {
  return (
    <div className="p-3 space-y-3 text-[10px]">
      {/* 挨拶 */}
      <div className="text-center pt-1">
        <p className="text-[9px] text-text-light">こんにちは</p>
        <p className="text-xs font-bold mt-0.5">Beauty Salon Hana</p>
      </div>
      {/* サマリーカード（実アプリ準拠: icon badge + 数値 + ラベル） */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-2xl p-2.5 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-accent">3</p>
              <p className="text-[9px] text-text-light">今日の予約</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-2.5 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold">48</p>
              <p className="text-[9px] text-text-light">顧客数</p>
            </div>
          </div>
        </div>
      </div>
      {/* KPIトレンド（実アプリ準拠: icon + 変化率 + 数値 + 比較バー） */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-2xl p-2.5 border border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span className="text-[8px] font-medium text-emerald-600">+12.3%</span>
          </div>
          <p className="text-sm font-bold mt-1">¥482,000</p>
          <p className="text-[8px] text-text-light">今月の売上</p>
          <div className="space-y-0.5 mt-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[7px] text-text-light w-4">今月</span>
              <div className="flex-1 h-1 bg-border/40 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: "85%" }} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[7px] text-text-light w-4">先月</span>
              <div className="flex-1 h-1 bg-border/40 rounded-full overflow-hidden">
                <div className="h-full bg-primary/30 rounded-full" style={{ width: "72%" }} />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-2.5 border border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <span className="text-[8px] font-medium text-emerald-600">+8.7%</span>
          </div>
          <p className="text-sm font-bold mt-1">23<span className="text-[9px] font-normal text-text-light ml-0.5">件</span></p>
          <p className="text-[8px] text-text-light">今月の来店</p>
          <div className="space-y-0.5 mt-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[7px] text-text-light w-4">今月</span>
              <div className="flex-1 h-1 bg-border/40 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: "90%" }} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[7px] text-text-light w-4">先月</span>
              <div className="flex-1 h-1 bg-border/40 rounded-full overflow-hidden">
                <div className="h-full bg-primary/30 rounded-full" style={{ width: "78%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 今日の予約リスト（実アプリ準拠: 時間(accent) + 名前 + メニュー） */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-bold text-[10px]">今日の予約</span>
          <span className="text-[8px] text-accent">すべて見る →</span>
        </div>
        <div className="space-y-1.5">
          {[
            { t: "10:00", n: "田中 美咲", m: "カット+カラー", done: false },
            { t: "13:00", n: "佐藤 花", m: "トリートメント", done: true },
            { t: "15:30", n: "鈴木 あい", m: "パーマ", done: false },
          ].map((a) => (
            <div key={a.t} className={`bg-white rounded-xl p-2 border ${a.done ? "border-green-200 bg-green-50/50" : "border-border"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-accent tabular-nums">{a.t}</span>
                  <span className="text-[10px] font-medium">{a.n}</span>
                </div>
                {a.done && (
                  <span className="text-[7px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">来店済</span>
                )}
              </div>
              <p className="text-[8px] text-text-light mt-0.5 ml-10">{a.m}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** カルテ記録画面 */
export function MockKarteScreen() {
  return (
    <div className="p-3 space-y-2.5 text-[10px]">
      {/* ヘッダー（実アプリ準拠: パンくず + タイトル） */}
      <div>
        <p className="text-[8px] text-accent">カルテ一覧 &gt;</p>
        <span className="font-bold text-xs text-text">カルテ新規作成</span>
      </div>
      {/* 顧客選択（実アプリ準拠: bg-background input） */}
      <div className="bg-background rounded-xl p-2.5">
        <span className="text-[9px] text-text-light">お客様</span>
        <div className="font-bold text-sm mt-0.5">田中 美咲 様</div>
      </div>
      {/* 施術日 */}
      <div>
        <label className="text-[9px] text-text-light block mb-0.5">施術日</label>
        <div className="bg-background rounded-xl px-2.5 py-2 border border-border text-[10px]">2026/03/06</div>
      </div>
      {/* メニュー選択（実アプリ準拠: チェックボックスリスト） */}
      <div className="bg-white rounded-xl p-2.5 border border-border space-y-1.5">
        <span className="font-bold text-[10px]">施術メニュー</span>
        {[
          { name: "カット+カラー", price: "¥12,000", checked: true },
          { name: "トリートメント", price: "¥3,000", checked: true },
          { name: "ヘッドスパ", price: "¥4,500", checked: false },
        ].map((m) => (
          <div key={m.name} className="flex items-center gap-2 py-1">
            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${m.checked ? "bg-accent border-accent" : "border-border"}`}>
              {m.checked && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </div>
            <span className={`flex-1 ${m.checked ? "font-medium" : "text-text-light"}`}>{m.name}</span>
            <span className="font-medium">{m.price}</span>
          </div>
        ))}
      </div>
      {/* 支払区分（実アプリ準拠: cash/credit/ticket/service ボタン） */}
      <div className="bg-white rounded-xl p-2.5 border border-border space-y-1.5">
        <span className="font-bold text-[10px]">支払区分</span>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px]">カット+カラー</span>
            <div className="flex gap-0.5">
              {["現金", "カード"].map((t, i) => (
                <span key={t} className={`text-[7px] px-1.5 py-0.5 rounded-md ${i === 1 ? "bg-accent text-white" : "bg-background text-text-light border border-border"}`}>{t}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px]">トリートメント</span>
            <div className="flex gap-0.5">
              {["現金", "カード"].map((t, i) => (
                <span key={t} className={`text-[7px] px-1.5 py-0.5 rounded-md ${i === 0 ? "bg-accent text-white" : "bg-background text-text-light border border-border"}`}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* 写真（実アプリ準拠: アップロードエリア） */}
      <div className="bg-white rounded-xl p-2.5 border border-border">
        <span className="font-bold text-[10px]">施術写真</span>
        <div className="flex gap-2 mt-1.5">
          <div className="flex-1 aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <span className="text-[8px] text-amber-600 font-medium">Before</span>
          </div>
          <div className="flex-1 aspect-square rounded-lg bg-gradient-to-br from-accent/20 to-accent/40 flex items-center justify-center">
            <span className="text-[8px] text-accent font-medium">After</span>
          </div>
          <div className="flex-1 aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center">
            <svg className="w-4 h-4 text-text-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
        </div>
      </div>
      {/* 保存ボタン（実アプリ準拠: bg-accent rounded-xl） */}
      <div className="bg-accent text-white rounded-xl p-2.5 text-center font-bold text-[11px]">
        保存する
      </div>
    </div>
  );
}

/** 予約管理画面 */
export function MockAppointmentScreen() {
  return (
    <div className="p-3 space-y-2.5 text-[10px]">
      {/* ヘッダー（実アプリ準拠: タイトル + 登録ボタン） */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-text">予約管理</span>
        <span className="bg-accent text-white text-[9px] font-medium rounded-xl px-2.5 py-1.5">+ 予約を登録</span>
      </div>
      {/* ビュー切替（実アプリ準拠: 日別/週別/月別/今日 ボタン群） */}
      <div className="flex gap-1">
        {["日別", "週別", "月別", "今日"].map((v, i) => (
          <span key={v} className={`text-[8px] px-2 py-1 rounded-lg font-medium ${i === 0 ? "bg-accent text-white" : "bg-white border border-border text-text-light"}`}>{v}</span>
        ))}
      </div>
      {/* 日付ナビ */}
      <div className="flex items-center justify-center gap-2">
        <ChevronIcon dir="left" />
        <span className="text-accent font-bold text-[11px]">3月6日(木)</span>
        <ChevronIcon dir="right" />
      </div>
      {/* タイムライン（実アプリ準拠: 時間帯スロット + 予約カード） */}
      <div className="space-y-1">
        {[
          { time: "10:00", name: "田中 美咲", menu: "カット+カラー", status: "" },
          { time: "11:00", name: "", menu: "", status: "" },
          { time: "13:00", name: "佐藤 花", menu: "トリートメント", status: "done" },
          { time: "15:30", name: "鈴木 あい", menu: "パーマ", status: "" },
        ].map((s) => (
          <div key={s.time} className={`rounded-xl p-2 border ${
            s.name
              ? s.status === "done"
                ? "border-green-200 bg-green-50/50"
                : "border-border bg-white"
              : "border-border border-dashed bg-white/50"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-accent tabular-nums w-7 text-[10px]">{s.time}</span>
                {s.name ? (
                  <div>
                    <span className="font-medium text-[10px]">{s.name}</span>
                    <p className="text-[8px] text-text-light">{s.menu}</p>
                  </div>
                ) : (
                  <span className="text-text-light text-[9px]">空き</span>
                )}
              </div>
              {s.status === "done" && (
                <span className="text-[7px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">来店済</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* LINE通知バッジ（実アプリ特有の機能） */}
      <div className="bg-[#06C755]/10 rounded-xl p-2 border border-[#06C755]/20 flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
            <path d="M12 2C6.48 2 2 5.92 2 10.66c0 2.78 1.56 5.24 4 6.86v3.48l3.14-1.72c.92.26 1.88.4 2.86.4 5.52 0 10-3.92 10-8.68S17.52 2 12 2z" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-[#06C755] text-[9px]">LINE通知 ON</div>
          <div className="text-[8px] text-text-light">予約確認・前日リマインド自動送信</div>
        </div>
      </div>
    </div>
  );
}

/** 顧客詳細画面 */
export function MockCustomerScreen() {
  return (
    <div className="p-3 space-y-2.5 text-[10px]">
      {/* ヘッダー（実アプリ準拠: パンくず + 名前 + 編集リンク） */}
      <div>
        <p className="text-[8px] text-accent">顧客一覧 &gt;</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-text">田中 美咲</span>
          <span className="text-[9px] text-accent">編集</span>
        </div>
        <p className="text-[8px] text-text-light">タナカ ミサキ</p>
      </div>
      {/* 来店分析カード（実アプリ準拠: bg-surface rounded-2xl, 3列統計） */}
      <div className="bg-white rounded-2xl p-3 border border-border space-y-2">
        <span className="font-bold text-[9px] text-text-light">来店分析</span>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-accent">12</p>
            <p className="text-[8px] text-text-light">来店回数</p>
          </div>
          <div>
            <p className="text-lg font-bold">5</p>
            <p className="text-[8px] text-text-light">日前に来店</p>
          </div>
          <div>
            <p className="text-lg font-bold">21</p>
            <p className="text-[8px] text-text-light">日（平均間隔）</p>
          </div>
        </div>
      </div>
      {/* 顧客インサイト（実アプリ準拠: よく利用メニューTop3 + 売上合計） */}
      <div className="bg-white rounded-2xl p-3 border border-border space-y-2">
        <span className="font-bold text-[9px] text-text-light">インサイト</span>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-text-light">よく利用するメニュー</span>
          </div>
          {[
            { name: "カット+カラー", count: "8回" },
            { name: "トリートメント", count: "5回" },
            { name: "パーマ", count: "2回" },
          ].map((m) => (
            <div key={m.name} className="flex items-center justify-between py-0.5">
              <span className="text-[9px]">{m.name}</span>
              <span className="text-[9px] text-text-light">{m.count}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-1.5 grid grid-cols-3 gap-1 text-center">
          <div>
            <p className="text-[8px] text-text-light">施術</p>
            <p className="text-[10px] font-bold">¥156K</p>
          </div>
          <div>
            <p className="text-[8px] text-text-light">物販</p>
            <p className="text-[10px] font-bold">¥24K</p>
          </div>
          <div>
            <p className="text-[8px] text-text-light">回数券</p>
            <p className="text-[10px] font-bold">¥20K</p>
          </div>
        </div>
      </div>
      {/* 施術履歴タブ（実アプリ準拠: ボタン型タブ） */}
      <div className="flex gap-1">
        {["施術", "写真", "回数券", "物販"].map((t, i) => (
          <span key={t} className={`text-[8px] px-2 py-1 rounded-lg font-medium ${i === 0 ? "bg-accent text-white" : "bg-white border border-border text-text-light"}`}>{t}</span>
        ))}
      </div>
      {/* 施術履歴リスト（実アプリ準拠: 個別カード） */}
      <div className="space-y-1.5">
        {[
          { date: "3/1", menu: "カット+カラー", price: "¥12,000" },
          { date: "2/15", menu: "トリートメント", price: "¥3,000" },
          { date: "2/1", menu: "カット", price: "¥5,500" },
        ].map((h) => (
          <div key={h.date} className="bg-white rounded-xl p-2 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-text-light">{h.date}</span>
                <span className="text-[10px] font-medium">{h.menu}</span>
              </div>
              <span className="text-[10px] font-medium">{h.price}</span>
            </div>
          </div>
        ))}
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
      {/* ヘッダー（実アプリ準拠） */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-text">売上レポート</span>
        <div className="flex items-center gap-1">
          <ChevronIcon dir="left" />
          <span className="text-accent font-bold text-[10px]">2026年</span>
          <ChevronIcon dir="right" />
        </div>
      </div>
      {/* メイン指標（実アプリ準拠: 大きな金額 + 前月比バッジ） */}
      <div className="bg-white rounded-2xl p-3 border border-border text-center">
        <span className="text-[9px] text-text-light">3月の売上</span>
        <div className="text-2xl font-bold text-text mt-0.5">¥482,000</div>
        <div className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 text-[9px] font-medium mt-1">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
          前月比 +12.3%
        </div>
      </div>
      {/* バーチャート */}
      <div className="bg-white rounded-2xl p-3 border border-border">
        <span className="font-bold text-[9px] text-text-light">月別推移</span>
        <div className="flex items-end justify-between gap-1.5 mt-2 h-20">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md ${m.current ? "bg-accent" : "bg-accent/25"}`}
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
      <div className="bg-white rounded-2xl p-2.5 border border-border space-y-1.5">
        <span className="font-bold text-[9px] text-text-light">売上内訳</span>
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

/* -- 内部ヘルパー -- */

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
