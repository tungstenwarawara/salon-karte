/** 1日の使い方 — タイムラインデザイン */
import Link from "next/link";

const STEPS = [
  {
    time: "朝",
    title: "ダッシュボードで今日の予約を確認",
    desc: "ログインすると今日の予約一覧が表示されます。お客様の名前・メニュー・時間をひと目で確認。在庫アラートもここでチェック。",
    link: "/dashboard",
    linkLabel: "ダッシュボードを開く",
    accent: "bg-[#8BBFA8]",
  },
  {
    time: "来店前",
    title: "前回の施術内容を確認",
    desc: "予約のお客様名をタップして顧客詳細へ。前回の施術内容・状態・次回への申し送りを確認できます。",
    link: "/customers",
    linkLabel: "顧客一覧を開く",
    accent: "bg-[#8BBFA8]",
  },
  {
    time: "施術後",
    title: "カルテを記入・写真を保存",
    desc: "使用した化粧品・施術前後の状態・会話メモ・注意事項・次回への申し送りを記録。写真もそのまま保存できます。",
    link: "/records/new",
    linkLabel: "カルテを作成する",
    accent: "bg-[#E4A89E]",
  },
  {
    time: "お会計",
    title: "物販・回数券があれば記録",
    desc: "商品を販売した場合は購入記録を登録。登録済み商品なら売価が自動入力され、在庫も自動で減算されます。",
    link: "/customers",
    linkLabel: "顧客を選んで記録する",
    accent: "bg-[#C4A0B8]",
  },
  {
    time: "最後に",
    title: "次回予約を登録",
    desc: "次回の来店日が決まったら予約を登録。ダッシュボードに自動表示されます。重複や営業時間外は警告が出ます。",
    link: "/appointments/new",
    linkLabel: "予約を登録する",
    accent: "bg-accent",
  },
];

export function GuideDailyFlow() {
  return (
    <div id="daily-flow" className="scroll-mt-20">
      <h3 className="font-bold text-base mb-4">1日の使い方</h3>

      <div className="relative">
        {/* タイムライン縦線 */}
        <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />

        <div className="space-y-4">
          {STEPS.map(({ time, title, desc, link, linkLabel, accent }) => (
            <div key={time} className="flex gap-3 relative">
              {/* ドット */}
              <div className="flex-shrink-0 relative z-10 mt-1">
                <div className={`w-[10px] h-[10px] rounded-full ${accent} ring-[3px] ring-surface`} />
              </div>

              {/* カード */}
              <div className="flex-1 bg-surface border border-border rounded-xl p-3 ml-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${accent}`}>
                    {time}
                  </span>
                  <h4 className="font-bold text-sm">{title}</h4>
                </div>
                <p className="text-xs text-text-light leading-relaxed">{desc}</p>
                <Link
                  href={link}
                  className="inline-block mt-2 text-xs text-accent hover:underline font-medium"
                >
                  {linkLabel} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
