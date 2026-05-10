type MenuItem = {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  price: number;
  duration_minutes: number;
};

type Props = {
  menus: MenuItem[];
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
};

/** Claude Design: エディトリアルなメニューテーブル、ホバーで背景拡張 */
export function HpMenu({ menus, eyebrow, headline, subheadline }: Props) {
  if (menus.length === 0) return null;

  return (
    <section className="px-[5vw] py-24 md:py-[120px] max-w-[1120px] mx-auto">
      <div className="text-center mb-16 md:mb-20">
        <span className="head-en reveal block">{eyebrow ?? "MENU & PRICE"}</span>
        <h2
          className="reveal font-serif-en italic font-light mt-6 leading-none"
          style={{ fontSize: "clamp(48px, 6vw, 84px)" }}
        >
          {headline ?? "Treatments."}
        </h2>
        {subheadline && (
          <p className="reveal font-serif-jp text-xs tracking-[0.4em] text-[color:var(--ink-mute)] mt-5">
            {subheadline}
          </p>
        )}
      </div>

      <div className="max-w-[880px] mx-auto">
        {menus.map((m, i) => (
          <div
            key={m.id}
            className="reveal grid items-baseline gap-8 py-9 cursor-pointer transition-all duration-500 group border-t border-[color:var(--line)] last:border-b last:border-b-[color:var(--line)] px-2 hover:bg-[color:var(--soft)] hover:px-6"
            style={{ gridTemplateColumns: "56px 1fr auto" }}
          >
            <span className="font-serif-en italic text-[color:var(--ink-mute)] text-[13px] tracking-[0.18em]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <span className="font-serif-jp text-lg tracking-[0.16em] block">
                {m.name}
              </span>
              {m.name_en && (
                <span className="block font-sans-en text-[10px] tracking-[0.3em] text-[color:var(--ink-mute)] mt-1.5 uppercase">
                  {m.name_en}
                </span>
              )}
              {m.description && (
                <span className="block text-xs text-[color:var(--ink-soft)] tracking-[0.06em] leading-[1.9] max-w-[460px] mt-3.5">
                  {m.description}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="font-sans-en text-[10px] tracking-[0.24em] text-[color:var(--ink-mute)] uppercase">
                {m.duration_minutes} min
              </div>
              <div className="font-serif-en font-light text-[22px] mt-1.5">
                {m.price.toLocaleString()}
                <span className="text-sm text-[color:var(--ink-mute)]"> 円</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center mt-14 text-[11px] tracking-[0.3em] text-[color:var(--ink-mute)]">
        All prices include tax · 会員価格・回数券は別途ご案内
      </p>
    </section>
  );
}
