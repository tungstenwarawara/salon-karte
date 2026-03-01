const PERMISSIONS: { category: string; items: { label: string; roles: [boolean, boolean, boolean] }[] }[] = [
  {
    category: "日常業務",
    items: [
      { label: "顧客の閲覧・登録・編集", roles: [true, true, true] },
      { label: "カルテの閲覧・作成・編集", roles: [true, true, true] },
      { label: "予約の閲覧・登録・編集", roles: [true, true, true] },
      { label: "物販・回数券の記録", roles: [true, true, true] },
    ],
  },
  {
    category: "経営・管理",
    items: [
      { label: "売上・経営レポートの閲覧", roles: [true, true, false] },
      { label: "施術メニューの管理", roles: [true, false, false] },
      { label: "スタッフの招待・管理", roles: [true, false, false] },
      { label: "サロン設定の変更", roles: [true, false, false] },
      { label: "退会（全データ削除）", roles: [true, false, false] },
    ],
  },
];

const ROLES = [
  { label: "オーナー", color: "bg-accent/10 text-accent border-accent/20" },
  { label: "マネージャー", color: "bg-violet-50 text-violet-600 border-violet-200" },
  { label: "スタッフ", color: "bg-slate-50 text-slate-600 border-slate-200" },
] as const;

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-emerald-500">
      <circle cx="9" cy="9" r="8" fill="currentColor" fillOpacity="0.1" />
      <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-slate-300">
      <circle cx="9" cy="9" r="8" fill="currentColor" fillOpacity="0.08" />
      <path d="M6.5 6.5L11.5 11.5M11.5 6.5L6.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function RolePermissionsTable() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
      <h3 className="font-bold text-sm text-text-light">ロール別の権限一覧</h3>

      {/* ロールヘッダー（モバイルの凡例） */}
      <div className="flex gap-2">
        {ROLES.map((role) => (
          <span
            key={role.label}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${role.color}`}
          >
            {role.label}
          </span>
        ))}
      </div>

      {/* 権限テーブル */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm" style={{ minWidth: 300 }}>
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-medium text-text-light py-2 pr-2">機能</th>
              {ROLES.map((role) => (
                <th key={role.label} className="text-center font-medium text-text-light py-2 w-[52px]">
                  <span className="hidden sm:inline">{role.label}</span>
                  <span className="sm:hidden">{role.label.charAt(0)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((group) => (
              <Group key={group.category} category={group.category} items={group.items} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Group({ category, items }: { category: string; items: { label: string; roles: [boolean, boolean, boolean] }[] }) {
  return (
    <>
      <tr>
        <td colSpan={4} className="pt-3 pb-1">
          <span className="text-xs font-bold text-text-light tracking-wider uppercase">{category}</span>
        </td>
      </tr>
      {items.map((item) => (
        <tr key={item.label} className="border-b border-border/50 last:border-0">
          <td className="py-2.5 pr-2 text-sm leading-snug">{item.label}</td>
          {item.roles.map((allowed, i) => (
            <td key={i} className="text-center py-2.5">
              <span className="inline-flex justify-center">
                {allowed ? <CheckIcon /> : <CrossIcon />}
              </span>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
