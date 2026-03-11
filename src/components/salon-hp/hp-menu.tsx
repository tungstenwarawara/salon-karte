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
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-gray-900">
          メニュー・料金
        </h2>
        <p className="text-sm text-gray-400 text-center mb-12">Menu &amp; Price</p>

        <div className="space-y-3">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="flex items-center justify-between py-5 px-1 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{menu.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{menu.duration_minutes}分</p>
              </div>
              <p className="text-lg font-bold text-gray-900 flex-shrink-0 ml-4">
                ¥{menu.price.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          ※ 表示価格は税込みです
        </p>
      </div>
    </section>
  );
}
