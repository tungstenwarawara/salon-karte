"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/sales", label: "売上レポート", exact: true },
  { href: "/sales/inventory", label: "在庫管理", exact: false },
];

export function ManagementTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1.5 bg-background rounded-xl p-1">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 text-center text-sm font-medium py-2.5 rounded-lg transition-colors min-h-[44px] flex items-center justify-center ${
              isActive
                ? "bg-accent text-white shadow-sm"
                : "text-text-light hover:text-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
