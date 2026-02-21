import Link from "next/link";
import { formatDateShort } from "@/lib/format";
import type { Database } from "@/types/database";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

type Props = {
  customerId: string;
  purchases: Purchase[];
  purchaseTotal: number;
};

export function PurchaseHistory({ customerId, purchases, purchaseTotal }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">
          物販購入履歴
          {purchaseTotal > 0 && (
            <span className="text-sm font-normal text-text-light ml-2">
              合計 {purchaseTotal.toLocaleString()}円
            </span>
          )}
        </h3>
        <Link
          href={`/customers/${customerId}/purchases/new`}
          className="bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors min-h-[40px] flex items-center"
        >
          + 購入記録
        </Link>
      </div>

      {purchases.length > 0 ? (
        <div className="space-y-2">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="bg-surface border border-border rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{purchase.item_name}</span>
                <span className="text-sm text-text-light">{formatDateShort(purchase.purchase_date)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-text-light">
                  {purchase.unit_price.toLocaleString()}円 x {purchase.quantity}
                </span>
                <span className="text-sm font-medium">{purchase.total_price.toLocaleString()}円</span>
              </div>
              {purchase.memo && (
                <p className="text-xs text-text-light mt-1">{purchase.memo}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-light text-sm">購入記録はまだありません</p>
          <Link
            href={`/customers/${customerId}/purchases/new`}
            className="inline-block mt-2 text-sm text-accent hover:underline font-medium"
          >
            最初の購入を記録する →
          </Link>
        </div>
      )}
    </div>
  );
}
