import { LoadingIllustration } from "@/components/ui/loading-illustration";

export default function SalesLoading() {
  return (
    <LoadingIllustration type="chart">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 skeleton rounded-lg" />
        <div className="h-10 w-20 skeleton rounded-xl" />
      </div>
      {/* グラフ */}
      <div className="skeleton border border-border rounded-2xl h-40 mt-4" />
      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton border border-border rounded-2xl p-3 h-16" />
        ))}
      </div>
    </LoadingIllustration>
  );
}
