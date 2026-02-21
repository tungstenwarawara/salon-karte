"use client";

export function PrintTrigger({ backHref }: { backHref: string }) {
  return (
    <div className="print:hidden flex items-center justify-between px-6 py-3 bg-gray-50 border-b">
      <a href={backHref} className="text-sm text-blue-600 hover:underline">
        ← 戻る
      </a>
      <button
        onClick={() => window.print()}
        className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors min-h-[40px] font-medium"
      >
        印刷 / PDF保存
      </button>
    </div>
  );
}
