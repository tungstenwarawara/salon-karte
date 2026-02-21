"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LapsedCustomer = {
  id: string;
  last_name: string;
  first_name: string;
  last_visit_date: string;
  days_since: number;
};

export function LapsedCustomersSection({
  initialCustomers,
  salonId,
}: {
  initialCustomers: LapsedCustomer[];
  salonId: string;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [graduatingId, setGraduatingId] = useState<string | null>(null);

  const handleGraduate = async (customer: LapsedCustomer) => {
    setGraduatingId(customer.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("customers")
      .update({ graduated_at: new Date().toISOString() })
      .eq("id", customer.id)
      .eq("salon_id", salonId);

    if (!error) {
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    }
    setGraduatingId(null);
  };

  if (customers.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">
          ご無沙汰のお客様
          <span className="text-xs font-normal text-text-light ml-2">
            60日以上
          </span>
        </h3>
        {customers.length > 3 && (
          <Link
            href="/customers"
            className="text-xs text-accent hover:underline"
          >
            他{customers.length - 3}名 →
          </Link>
        )}
      </div>
      <div className="space-y-2">
        {customers.slice(0, 3).map((c) => (
          <div
            key={c.id}
            className="bg-surface border border-orange-200 rounded-xl p-3 flex items-center justify-between"
          >
            <Link
              href={`/customers/${c.id}`}
              className="flex-1 min-w-0 hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">
                  {c.last_name} {c.first_name}
                </span>
                <span
                  className={`text-xs font-medium shrink-0 ml-2 ${
                    c.days_since >= 90 ? "text-red-500" : "text-orange-500"
                  }`}
                >
                  {c.days_since}日前
                </span>
              </div>
            </Link>
            <button
              onClick={() => handleGraduate(c)}
              disabled={graduatingId === c.id}
              className="ml-3 text-[10px] text-text-light border border-border rounded-lg px-2 py-1 hover:bg-background transition-colors disabled:opacity-50 shrink-0"
              title="ご無沙汰リストから非表示にする"
            >
              {graduatingId === c.id ? "..." : "卒業"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
