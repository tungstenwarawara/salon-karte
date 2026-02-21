import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];

type ProductCardProps = {
  product: Product;
  onEdit: (product: Product) => void;
  onToggleActive: (productId: string, currentActive: boolean) => void;
  onDelete: (productId: string) => void;
};

/** 商品マスタ一覧のカード表示 */
export function ProductCard({ product, onEdit, onToggleActive, onDelete }: ProductCardProps) {
  return (
    <div
      className={`bg-surface border rounded-xl p-4 ${product.is_active ? "border-border" : "border-border opacity-60"}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium">{product.name}</p>
            {!product.is_active && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">
                非表示
              </span>
            )}
          </div>
          <div className="flex gap-3 mt-1 text-sm text-text-light flex-wrap">
            {product.category && <span>{product.category}</span>}
            <span>売価 ¥{product.base_sell_price.toLocaleString()}</span>
            <span>仕入 ¥{product.base_cost_price.toLocaleString()}</span>
            <span>発注点 {product.reorder_point}個</span>
          </div>
          {product.memo && (
            <p className="text-xs text-text-light mt-1">{product.memo}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          {/* 表示切替トグル */}
          <button
            onClick={() => onToggleActive(product.id, product.is_active)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.is_active ? "bg-accent" : "bg-gray-200"}`}
            aria-label={product.is_active ? "非表示にする" : "表示にする"}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.is_active ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          <button
            onClick={() => onEdit(product)}
            className="text-sm text-accent hover:underline min-h-[48px] flex items-center"
          >
            編集
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="text-sm text-error hover:underline min-h-[48px] flex items-center"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
