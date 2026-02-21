"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { NavIcon } from "./nav-icon";

const navItems = [
  { href: "/dashboard", label: "ホーム", icon: "home" },
  { href: "/appointments", label: "予約", icon: "calendar" },
  { href: "/customers", label: "顧客", icon: "customers" },
  { href: "/sales", label: "経営", icon: "sales" },
];

const fabActions = [
  { href: "/appointments/new", label: "予約を追加", icon: "fab-calendar" },
  { href: "/records/new", label: "カルテを書く", icon: "fab-record" },
  { href: "/customers/new", label: "顧客を登録", icon: "fab-customer" },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setFabOpen(false); }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setFabOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      {/* トップヘッダー */}
      <header className="sticky top-0 z-50 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-primary">
          サロンカルテ
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-text-light hover:text-accent transition-colors" aria-label="設定">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </Link>
          <Link href="/guide" className="text-text-light hover:text-accent transition-colors" aria-label="使い方ガイド">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* FABオーバーレイ */}
      {fabOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={() => setFabOpen(false)} />
      )}

      {/* ボトムナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-end">
          {navItems.slice(0, 2).map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center py-2 px-3 min-w-[56px] min-h-[48px] justify-center transition-colors ${isActive ? "text-accent" : "text-text-light"}`}>
                <NavIcon icon={item.icon} /><span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}

          {/* FAB */}
          <div ref={fabRef} className="relative flex flex-col items-center -mt-4">
            {fabOpen && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-surface rounded-2xl shadow-lg border border-border py-2 w-48 z-50">
                {fabActions.map((action) => (
                  <Link key={action.href} href={action.href}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-text"
                    onClick={() => setFabOpen(false)}>
                    <span className="text-accent"><NavIcon icon={action.icon} /></span>
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                ))}
              </div>
            )}
            <button onClick={() => setFabOpen(!fabOpen)}
              className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all ${fabOpen ? "bg-text text-white rotate-45" : "bg-accent text-white"}`}
              aria-label="新規作成">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            <span className="text-[10px] text-text-light mt-0.5">新規</span>
          </div>

          {navItems.slice(2).map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center py-2 px-3 min-w-[56px] min-h-[48px] justify-center transition-colors ${isActive ? "text-accent" : "text-text-light"}`}>
                <NavIcon icon={item.icon} /><span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
