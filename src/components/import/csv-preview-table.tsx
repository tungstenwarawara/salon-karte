"use client";

export type ColumnDef = {
  key: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: (row: any) => React.ReactNode;
};

export type BaseRow = {
  rowIndex: number;
  status: "ok" | "warning" | "error" | "skip";
  messages: string[];
  isDuplicate: boolean;
  checked: boolean;
};

export function CsvPreviewTable<T extends BaseRow>({
  rows,
  columns,
  encoding,
  onToggleRow,
  onToggleAll,
  onImport,
  onReset,
}: {
  rows: T[];
  columns: ColumnDef[];
  encoding: string;
  onToggleRow: (rowIndex: number) => void;
  onToggleAll: (checked: boolean) => void;
  onImport: () => void;
  onReset: () => void;
}) {
  const checkedCount = rows.filter((r) => r.checked).length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div>
            <p className="text-lg font-bold">{rows.length}</p>
            <p className="text-xs text-text-light">全件数</p>
          </div>
          <div>
            <p className="text-lg font-bold text-accent">{checkedCount}</p>
            <p className="text-xs text-text-light">取り込み対象</p>
          </div>
          {errorCount > 0 && (
            <div>
              <p className="text-lg font-bold text-red-500">{errorCount}</p>
              <p className="text-xs text-text-light">エラー</p>
            </div>
          )}
          {duplicateCount > 0 && (
            <div>
              <p className="text-lg font-bold text-orange-500">{duplicateCount}</p>
              <p className="text-xs text-text-light">重複</p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-text-light text-center mt-2">
          文字コード: {encoding}
        </p>
      </div>

      {/* 一括操作 */}
      <div className="flex gap-2">
        <button
          onClick={() => onToggleAll(true)}
          className="text-xs text-accent border border-accent rounded-lg px-3 py-1.5 hover:bg-accent/5"
        >
          全て選択
        </button>
        <button
          onClick={() => onToggleAll(false)}
          className="text-xs text-text-light border border-border rounded-lg px-3 py-1.5 hover:bg-background"
        >
          全て解除
        </button>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 px-1 text-left w-8"></th>
              <th className="py-2 px-1 text-left w-8">行</th>
              {columns.map((col) => (
                <th key={col.key} className="py-2 px-2 text-left whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              <th className="py-2 px-2 text-left">状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.rowIndex}
                className={`border-b border-border/50 ${
                  row.status === "error"
                    ? "bg-red-50"
                    : row.isDuplicate
                      ? "bg-orange-50"
                      : row.checked
                        ? ""
                        : "opacity-50"
                }`}
              >
                <td className="py-2 px-1">
                  <input
                    type="checkbox"
                    checked={row.checked}
                    disabled={row.status === "error"}
                    onChange={() => onToggleRow(row.rowIndex)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="py-2 px-1 text-text-light">{row.rowIndex + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className="py-2 px-2 whitespace-nowrap max-w-[120px] truncate">
                    {col.render(row)}
                  </td>
                ))}
                <td className="py-2 px-2">
                  {row.status === "error" && (
                    <span className="text-red-500" title={row.messages.join(", ")}>❌</span>
                  )}
                  {row.status === "warning" && (
                    <span className="text-orange-500" title={row.messages.join(", ")}>⚠️</span>
                  )}
                  {row.status === "ok" && !row.isDuplicate && (
                    <span className="text-success">✓</span>
                  )}
                  {row.isDuplicate && (
                    <span className="text-orange-500">重複</span>
                  )}
                  {row.messages.length > 0 && (
                    <p className="text-[10px] text-text-light mt-0.5 whitespace-normal">
                      {row.messages[0]}
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 border border-border text-sm font-medium py-3 rounded-xl hover:bg-background transition-colors"
        >
          やり直す
        </button>
        <button
          onClick={onImport}
          disabled={checkedCount === 0}
          className="flex-1 bg-accent text-white text-sm font-medium py-3 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {checkedCount}件を取り込む
        </button>
      </div>
    </div>
  );
}
