"use client";

type Tab = {
  key: string;
  label: string;
  count: number;
};

type Props = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
};

export function CustomerDetailTabs({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div className="sticky top-[52px] z-40 bg-background -mx-4 px-4 border-b border-border">
      <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`shrink-0 text-sm px-3 py-3 min-h-[48px] transition-colors border-b-2 ${
                isActive
                  ? "border-accent text-accent font-medium"
                  : "border-transparent text-text-light hover:text-text"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "bg-border text-text-light"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
