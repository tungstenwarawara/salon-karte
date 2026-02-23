"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DISMISS_KEY = "inventory-setup-guide-dismissed";

const steps = [
  {
    number: 1,
    title: "CSVで施術履歴を取り込む",
    description: "過去の売上が記録されます",
    href: "/settings/import-records",
    linkLabel: "取り込みページへ →",
  },
  {
    number: 2,
    title: "仕入れを入力する",
    description: "仕入れた分、在庫が増えます",
    href: "/sales/inventory/receive",
    linkLabel: "仕入記録へ →",
  },
  {
    number: 3,
    title: "棚卸しで今の実在庫を入力",
    description: "在庫数と金額が正しくなります",
    href: "/sales/inventory/stocktake",
    linkLabel: "棚卸しへ →",
  },
];

export function InventorySetupGuide() {
  // デフォルト非表示でフラッシュ防止
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-blue-900">
          はじめての在庫セットアップ
        </h3>
        <button
          onClick={handleDismiss}
          className="text-blue-400 hover:text-blue-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-blue-800">
        売上の記録と在庫の管理は別々に行います。<br />
        以下の順番で在庫を整えましょう。
      </p>

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-blue-200 text-blue-800 text-sm font-bold flex items-center justify-center mt-0.5">
              {step.number}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">{step.title}</p>
              <p className="text-xs text-blue-600 mt-0.5">{step.description}</p>
              <Link
                href={step.href}
                className="inline-block text-xs text-accent hover:underline font-medium mt-1 min-h-[44px] flex items-center"
              >
                {step.linkLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-blue-600 border-t border-blue-200 pt-3">
        ※ 売れた分を1件ずつ入力し直す必要はありません。<br />
        CSVで売上は記録済み、棚卸しで在庫が合います。
      </p>
    </div>
  );
}
