type MenuItem = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
};

type Props = {
  menus: MenuItem[];
};

/** NANA系: NANAのMENU&PRICE構成を踏襲。左にメニュー名、右に価格、細罫線区切り */
export function HpMenu({ menus }: Props) {
  if (menus.length === 0) return null;

  return (
    <section className="py-24 md:py-32 hp-section bg-white">
      <div className="max-w-3xl mx-auto px-5 md:px-10">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-4">
            Menu &amp; Price
          </p>
          <h2
            className="text-2xl md:text-[1.6rem] font-light tracking-[0.1em] text-gray-800"
            style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
          >
            メニュー・料金
          </h2>
        </div>

        <ul className="border-t border-[#E5DBCB]/60">
          {menus.map((menu) => {
            const isPopular = menu.name.includes("人気") || menu.name.includes("No.1");
            return (
              <li
                key={menu.id}
                className="grid grid-cols-12 gap-4 items-baseline py-5 md:py-6 border-b border-[#E5DBCB]/60"
              >
                <div className="col-span-8 md:col-span-9">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p
                      className="text-sm md:text-[0.95rem] text-gray-800 tracking-wider"
                      style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
                    >
                      {menu.name}
                    </p>
                    {isPopular && (
                      <span className="text-[9px] tracking-[0.2em] text-[#9B7A52] uppercase border border-[#9B7A52]/40 px-2 py-0.5">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] tracking-[0.15em] text-gray-400 uppercase mt-1.5">
                    {menu.duration_minutes} min
                  </p>
                </div>
                <p
                  className="col-span-4 md:col-span-3 text-right text-base md:text-lg text-gray-700 tabular-nums tracking-wider"
                  style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
                >
                  ¥{menu.price.toLocaleString()}
                </p>
              </li>
            );
          })}
        </ul>

        <p className="text-[10px] tracking-[0.2em] text-gray-400 mt-10 text-center uppercase">
          All prices include tax · Course tickets available
        </p>
      </div>
    </section>
  );
}
