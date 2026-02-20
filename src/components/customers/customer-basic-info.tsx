import Link from "next/link";
import type { Database } from "@/types/database";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

type Props = {
  customer: Customer;
  customerId: string;
};

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex">
      <span className="text-sm text-text-light w-24 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function InfoRowEmpty({ label, editHref }: { label: string; editHref: string }) {
  return (
    <div className="flex">
      <span className="text-sm text-text-light w-24 shrink-0">{label}</span>
      <Link href={editHref} className="text-sm text-gray-400 hover:text-accent transition-colors">
        未登録 →
      </Link>
    </div>
  );
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function CustomerBasicInfo({ customer, customerId }: Props) {
  const editHref = `/customers/${customerId}/edit`;
  const age = customer.birth_date ? calculateAge(customer.birth_date) : null;

  return (
    <>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-text-light">基本情報</h3>
        {customer.phone ? (
          <div className="flex">
            <span className="text-sm text-text-light w-24 shrink-0">電話番号</span>
            <a href={`tel:${customer.phone}`} className="text-sm text-accent hover:underline">
              {customer.phone}
            </a>
          </div>
        ) : (
          <InfoRowEmpty label="電話番号" editHref={editHref} />
        )}
        {customer.email ? (
          <div className="flex">
            <span className="text-sm text-text-light w-24 shrink-0">メール</span>
            <a href={`mailto:${customer.email}`} className="text-sm text-accent hover:underline break-all">
              {customer.email}
            </a>
          </div>
        ) : (
          <InfoRowEmpty label="メール" editHref={editHref} />
        )}
        {customer.birth_date ? (
          <InfoRow
            label="生年月日"
            value={age !== null ? `${customer.birth_date}（${age}歳）` : customer.birth_date}
          />
        ) : (
          <InfoRowEmpty label="生年月日" editHref={editHref} />
        )}
        <InfoRow label="住所" value={customer.address} />
        <InfoRow label="婚姻状況" value={customer.marital_status} />
        <InfoRow
          label="お子様"
          value={customer.has_children === null ? null : customer.has_children ? "あり" : "なし"}
        />
        <InfoRow
          label="DM送付"
          value={customer.dm_allowed === null ? null : customer.dm_allowed ? "可" : "不可"}
        />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-text-light">施術関連情報</h3>
        <InfoRow label="身長" value={customer.height_cm !== null ? `${customer.height_cm} cm` : null} />
        <InfoRow label="体重" value={customer.weight_kg !== null ? `${customer.weight_kg} kg` : null} />
        <InfoRow label="アレルギー" value={customer.allergies} />
        <InfoRow label="最終目標" value={customer.treatment_goal} />
        <InfoRow label="メモ" value={customer.notes} />
      </div>
    </>
  );
}
