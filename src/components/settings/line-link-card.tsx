type LineLink = {
  id: string;
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  is_following: boolean;
  customer_id: string | null;
  linked_at: string | null;
};

type Customer = {
  id: string;
  last_name: string;
  first_name: string;
};

type Props = {
  link: LineLink;
  customers: Customer[];
  linkedCustomerIds: Set<string | null>;
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  onLink: () => void;
  onUnlink: () => void;
  onTest: () => void;
  saving: boolean;
  testing: boolean;
};

export function LineLinkCard({
  link,
  customers,
  linkedCustomerIds,
  selectedCustomerId,
  onSelectCustomer,
  onLink,
  onUnlink,
  onTest,
  saving,
  testing,
}: Props) {
  const linkedCustomer = link.customer_id
    ? customers.find((c) => c.id === link.customer_id)
    : null;

  return (
    <div className="bg-surface border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {link.picture_url ? (
            <img src={link.picture_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-border shrink-0 flex items-center justify-center text-xs text-text-light">
              {(link.display_name ?? "?")[0]}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{link.display_name ?? "名前なし"}</p>
            {!link.is_following && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">ブロック中</span>
            )}
          </div>
        </div>

        {link.is_following && (
          <button
            onClick={onTest}
            disabled={testing}
            className="text-xs text-accent px-2 py-1.5 rounded-lg hover:bg-accent/5 min-h-[44px] disabled:opacity-50"
          >
            {testing ? "送信中..." : "テスト送信"}
          </button>
        )}
      </div>

      {linkedCustomer ? (
        <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
          <p className="text-sm">
            <span className="text-text-light text-xs mr-1">紐付け:</span>
            {linkedCustomer.last_name} {linkedCustomer.first_name}
          </p>
          <button
            onClick={onUnlink}
            disabled={saving}
            className="text-xs text-error px-2 py-1.5 rounded-lg hover:bg-error/5 min-h-[44px] disabled:opacity-50"
          >
            解除
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={selectedCustomerId}
            onChange={(e) => onSelectCustomer(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">顧客を選択...</option>
            {customers
              .filter((c) => !linkedCustomerIds.has(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.last_name} {c.first_name}
                </option>
              ))}
          </select>
          <button
            onClick={onLink}
            disabled={!selectedCustomerId || saving}
            className="shrink-0 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg px-3 py-2 transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {saving ? "保存中..." : "紐付け"}
          </button>
        </div>
      )}
    </div>
  );
}
