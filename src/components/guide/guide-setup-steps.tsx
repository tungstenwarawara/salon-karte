/** 初期設定ステップ — プログレスバー付き */
import Link from "next/link";

const STEPS = [
  {
    title: "営業時間を設定する",
    desc: "曜日ごとの営業日・時間を設定。予約時に営業時間外の警告や空き時間表示に活用されます。不定休もカレンダーから設定できます。",
    link: "/settings/business-hours",
    linkLabel: "営業時間を設定する",
    optional: false,
  },
  {
    title: "施術メニューを登録する",
    desc: "フェイシャル、ボディケアなどのメニューを登録。カルテ作成・予約時にワンタップで選べます。所要時間で終了時間も自動計算。",
    link: "/settings/menus",
    linkLabel: "メニューを登録する",
    optional: false,
  },
  {
    title: "お客様を登録する",
    desc: "既存のお客様の情報を登録しましょう。名前（カナ）、電話番号、アレルギー、施術目標などを入力できます。CSVで一括インポートも可能です。",
    link: "/customers/new",
    linkLabel: "顧客を登録する",
    optional: false,
  },
  {
    title: "予約を入れてみる",
    desc: "予約を登録してみましょう。ホットペッパー、電話、LINEなど予約元も記録できます。メニュー複数選択で終了時間を自動計算。",
    link: "/appointments/new",
    linkLabel: "予約を登録する",
    optional: false,
  },
  {
    title: "商品を登録する",
    desc: "店頭で化粧品やグッズを販売している場合、商品マスタに登録すると在庫が自動管理されます。仕入価・売価・発注点を設定。",
    link: "/sales/inventory/products",
    linkLabel: "商品を登録する",
    optional: true,
  },
  {
    title: "繰越在庫を設定する",
    desc: "手元に在庫がある場合は棚卸し画面で現在数を入力。過去の全履歴は不要です。入力した数量がそのまま初期在庫になります。",
    link: "/sales/inventory/stocktake",
    linkLabel: "棚卸しで在庫を設定する",
    optional: true,
  },
];

export function GuideSetupSteps() {
  return (
    <div id="setup" className="scroll-mt-20">
      <h3 className="font-bold text-base mb-4">最初にやること</h3>

      <div className="space-y-3">
        {STEPS.map(({ title, desc, link, linkLabel, optional }, i) => (
          <div
            key={title}
            className="bg-surface border border-border rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              {/* 番号バッジ */}
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm">{title}</h4>
                  {optional && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-background text-text-light font-medium border border-border">
                      物販がある方
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-light mt-1 leading-relaxed">{desc}</p>
                <Link
                  href={link}
                  className="inline-block mt-2 text-xs text-accent hover:underline font-medium"
                >
                  {linkLabel} →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
