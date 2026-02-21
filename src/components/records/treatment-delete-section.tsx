"use client";

type Props = {
  deleting: boolean;
  onDelete: () => void;
};

/** カルテ削除ゾーン（危険な操作） */
export function TreatmentDeleteSection({ deleting, onDelete }: Props) {
  return (
    <div className="bg-surface border border-error/20 rounded-2xl p-5">
      <h3 className="font-bold text-sm text-error mb-2">危険な操作</h3>
      <p className="text-sm text-text-light mb-3">この施術記録を削除します。この操作は取り消せません。</p>
      <button onClick={onDelete} disabled={deleting}
        className="bg-error/10 text-error text-sm font-medium rounded-xl px-4 py-2 hover:bg-error/20 transition-colors disabled:opacity-50 min-h-[48px]">
        {deleting ? "削除中..." : "この記録を削除"}
      </button>
    </div>
  );
}
