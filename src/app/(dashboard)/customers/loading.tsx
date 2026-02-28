import { LoadingIllustration } from "@/components/ui/loading-illustration";

export default function CustomersLoading() {
  return (
    <LoadingIllustration type="customer">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 skeleton rounded-lg" />
        <div className="h-10 w-28 skeleton rounded-xl" />
      </div>
      {/* 検索 */}
      <div className="h-12 skeleton border border-border rounded-xl mt-4" />
      {/* カード */}
      <div className="space-y-2 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton border border-border rounded-xl p-4 h-16" />
        ))}
      </div>
    </LoadingIllustration>
  );
}
