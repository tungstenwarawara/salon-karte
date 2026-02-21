import Link from "next/link";

type InventoryAlertItem = {
  product_id: string;
  product_name: string;
  current_stock: number;
  reorder_point: number;
};

export function InventoryAlert({ items }: { items: InventoryAlertItem[] }) {
  if (items.length === 0) return null;

  return (
    <Link
      href="/sales/inventory"
      className="block bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:border-amber-400 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <span className="text-sm font-bold text-amber-700">
          在庫アラート: {items.length}商品が発注点以下
        </span>
      </div>
      <div className="space-y-1 ml-7">
        {items.slice(0, 3).map((item) => (
          <p key={item.product_id} className="text-xs text-amber-600">
            {item.product_name}: 残り{item.current_stock}個
          </p>
        ))}
        {items.length > 3 && (
          <p className="text-xs text-amber-500">他 {items.length - 3}商品</p>
        )}
      </div>
    </Link>
  );
}
