import Link from "next/link";

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link
        href="/appointments/new"
        className="bg-surface border border-border rounded-xl p-3 text-center hover:border-accent transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-accent">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <p className="text-xs font-medium">予約追加</p>
      </Link>
      <Link
        href="/customers/new"
        className="bg-surface border border-border rounded-xl p-3 text-center hover:border-accent transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-accent">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
        </div>
        <p className="text-xs font-medium">顧客登録</p>
      </Link>
    </div>
  );
}
