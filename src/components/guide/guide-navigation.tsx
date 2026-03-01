"use client";

const SECTIONS = [
  { id: "overview", label: "できること" },
  { id: "daily-flow", label: "1日の流れ" },
  { id: "setup", label: "初期設定" },
  { id: "features", label: "機能一覧" },
  { id: "security", label: "セキュリティ" },
  { id: "faq", label: "FAQ" },
  { id: "pricing", label: "料金" },
];

export function GuideNavigation() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 72; // ヘッダー高さ分のオフセット
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <nav className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          className="flex-shrink-0 text-sm px-4 py-2 rounded-full bg-surface border border-border text-text-light hover:bg-accent hover:text-white hover:border-accent transition-all min-h-[44px] font-medium active:scale-95"
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
