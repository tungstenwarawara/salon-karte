"use client";

import { useState } from "react";

type Props = {
  deleting: boolean;
  onDelete: () => void;
};

/** カルテ削除ゾーン（危険な操作・インライン確認） */
export function TreatmentDeleteSection({ deleting, onDelete }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (showConfirm) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
        <p className="text-sm font-medium text-red-800">この施術記録を削除しますか？</p>
        <p className="text-xs text-red-700">この操作は取り消せません。</p>
        <div className="flex gap-3">
          <button onClick={() => setShowConfirm(false)} disabled={deleting} className="flex-1 text-sm py-2.5 rounded-xl border border-border hover:bg-background transition-colors min-h-[44px]">キャンセル</button>
          <button onClick={onDelete} disabled={deleting} className="flex-1 text-sm py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 min-h-[44px]">{deleting ? "削除中..." : "削除する"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-error/20 rounded-2xl p-5">
      <h3 className="font-bold text-sm text-error mb-2">危険な操作</h3>
      <p className="text-sm text-text-light mb-3">この施術記録を削除します。この操作は取り消せません。</p>
      <button onClick={() => setShowConfirm(true)} className="bg-error/10 text-error text-sm font-medium rounded-xl px-4 py-2 hover:bg-error/20 transition-colors min-h-[48px]">この記録を削除</button>
    </div>
  );
}
