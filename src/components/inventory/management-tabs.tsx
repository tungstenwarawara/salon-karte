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
    <div className="flex gap-2">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-sm px-4 py-2 rounded-xl transition-colors min-h-[48px] flex items-center justify-center ${
              isActive
                ? "bg-accent text-white"
                : "bg-surface border border-border text-text-light hover:text-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
