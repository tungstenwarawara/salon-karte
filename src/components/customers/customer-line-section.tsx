type LineLink = {
  id: string;
  display_name: string | null;
  is_following: boolean;
  linked_at: string | null;
};

type Props = {
  lineLink: LineLink | null;
};

export function CustomerLineSection({ lineLink }: Props) {
  if (!lineLink) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-sm text-text-light">LINE連携</h3>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${lineLink.is_following ? "bg-green-500" : "bg-gray-300"}`} />
        <p className="text-sm">
          {lineLink.display_name ?? "名前なし"}
          {!lineLink.is_following && <span className="text-xs text-text-light ml-1">（ブロック中）</span>}
        </p>
      </div>
      {lineLink.linked_at && (
        <p className="text-xs text-text-light">
          紐付け日: {new Date(lineLink.linked_at).toLocaleDateString("ja-JP")}
        </p>
      )}
    </div>
  );
}
