"use client";

type Props = {
  value: "manager" | "staff";
  onChange: (role: "manager" | "staff") => void;
  /** ラジオボタンのname属性（同一ページに複数ある場合に区別） */
  name?: string;
};

const ROLES = [
  {
    value: "staff" as const,
    label: "スタッフ",
    description: "予約・カルテ・顧客情報の閲覧と登録",
  },
  {
    value: "manager" as const,
    label: "マネージャー",
    description: "スタッフの全機能＋売上レポートの閲覧",
  },
];

export function RoleSelector({ value, onChange, name = "role" }: Props) {
  return (
    <div className="space-y-2">
      {ROLES.map((role) => (
        <label
          key={role.value}
          className={`block border rounded-xl p-3 cursor-pointer transition-colors ${
            value === role.value
              ? "border-accent bg-accent/5"
              : "border-border bg-background hover:border-accent/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name={name}
              value={role.value}
              checked={value === role.value}
              onChange={() => onChange(role.value)}
              className="accent-accent"
            />
            <span className="font-medium text-sm">{role.label}</span>
          </div>
          <p className="text-xs text-text-light mt-1 ml-5">{role.description}</p>
        </label>
      ))}
    </div>
  );
}
