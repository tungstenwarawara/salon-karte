/** 競合比較テーブル */

const COMPETITORS = [
  { name: "サロンカルテ", price: "2,980円", highlight: true },
  { name: "カルテ特化型A", price: "5,500円〜" },
  { name: "予約管理型B", price: "0円〜*" },
  { name: "総合管理型C", price: "9,790円〜" },
];

type Feature = {
  label: string;
  values: (boolean | string)[];
};

const FEATURES: Feature[] = [
  { label: "月額料金", values: ["2,980円", "5,500円〜", "0円〜※", "9,790円〜"] },
  { label: "初期費用", values: ["0円", "0円", "0円", "0円"] },
  { label: "カルテ管理", values: [true, true, true, false] },
  { label: "予約管理", values: [true, true, true, true] },
  { label: "LINE連携", values: [true, true, false, false] },
  { label: "売上レポート", values: [true, true, false, true] },
  { label: "在庫管理", values: [true, false, false, false] },
  { label: "確定申告サポート", values: [true, false, false, false] },
  { label: "カウンセリングシート", values: [true, false, false, false] },
  { label: "スタッフ管理", values: [true, true, true, true] },
];

export function ComparisonSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            他サービスとの比較
          </h2>
          <p className="text-text-light text-lg">
            全機能込みで、この価格はサロンカルテだけ。
          </p>
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-text-light p-3 w-[160px]" />
                {COMPETITORS.map((c) => (
                  <th
                    key={c.name}
                    className={`text-center text-sm font-bold p-3 ${
                      c.highlight
                        ? "bg-accent/5 text-accent border-t-2 border-x border-accent rounded-t-xl"
                        : "text-text"
                    }`}
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, ri) => (
                <tr key={f.label} className={ri % 2 === 0 ? "bg-background/50" : ""}>
                  <td className="text-sm font-medium p-3 border-b border-border/50">
                    {f.label}
                  </td>
                  {f.values.map((v, ci) => (
                    <td
                      key={ci}
                      className={`text-center text-sm p-3 border-b border-border/50 ${
                        ci === 0 ? "bg-accent/5 border-x border-accent/20" : ""
                      }`}
                    >
                      {typeof v === "boolean" ? (
                        v ? (
                          <span className="text-accent font-bold">◯</span>
                        ) : (
                          <span className="text-text-light">—</span>
                        )
                      ) : (
                        <span className={ci === 0 ? "font-bold text-accent" : ""}>
                          {v}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-text-light mt-4 text-center">
          ※ 2026年3月時点の一般的な価格帯での比較です。
          サービスによっては売上連動型の料金体系もあります。
        </p>
      </div>
    </section>
  );
}
