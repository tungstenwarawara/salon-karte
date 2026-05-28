"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export type MissingPrerequisite = "customers" | "menus";

const ITEM_META: Record<MissingPrerequisite, { label: string; href: string; cta: string; desc: string }> = {
  customers: {
    label: "お客様",
    href: "/customers/new",
    cta: "顧客を登録する",
    desc: "施術を記録する相手の情報を登録します（30秒）",
  },
  menus: {
    label: "メニュー",
    href: "/settings/menus",
    cta: "メニューを登録する",
    desc: "提供している施術メニューを1つ以上登録します",
  },
};

export function PrerequisiteGuard({ missing }: { missing: MissingPrerequisite[] }) {
  if (missing.length === 0) return null;

  const items = missing.map((key) => ({ key, ...ITEM_META[key] }));

  return (
    <div className="space-y-4">
      <PageHeader title="施術記録を作成" breadcrumbs={[{ label: "カルテ作成" }]} />
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="font-bold">カルテを記録する前に</h3>
          <p className="text-sm text-text-light">
            先に{items.map((i) => i.label).join("と")}の登録が必要です。下のボタンから登録してください。
          </p>
        </div>
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.key} className="bg-surface border border-border rounded-xl p-3 space-y-2">
              <p className="text-xs text-text-light">{i.desc}</p>
              <Link
                href={i.href}
                className="bg-accent hover:bg-accent-light text-white font-medium rounded-xl px-4 py-3 text-center min-h-[48px] flex items-center justify-center transition-colors"
              >
                {i.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
