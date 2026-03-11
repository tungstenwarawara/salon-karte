type MenuItem = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
};

type Props = {
  menus: MenuItem[];
};

export function HpMenu({ menus }: Props) {
  if (menus.length === 0) return null;

  return (
    <section className="py-20 md:py-28 hp-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
          メニュー・料金
        </h2>
        <p className="text-xs tracking-[0.3em] text-[#C4956A] text-center mb-14 uppercase">Menu &amp; Price</p>

        <div className="space-y-0 divide-y divide-[#E8E0D8]/60">
          {menus.map((menu, i) => {
            const isPopular = menu.name.includes("人気");
            return (
              <div
                key={menu.id}
                className={`flex items-center justify-between py-6 px-2 ${i === 0 ? "" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-[0.95rem]">{menu.name}</p>
                    {isPopular && (
                      <span className="text-[10px] font-bold text-[#C4956A] bg-[#C4956A]/8 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                        人気
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{menu.duration_minutes}分</p>
                </div>
                <p className="text-xl font-bold text-gray-900 flex-shrink-0 ml-6 tabular-nums">
                  ¥{menu.price.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 mt-8 text-center">
          ※ 表示価格は税込みです ・ 回数券もご用意しております
        </p>
      </div>
    </section>
  );
}
