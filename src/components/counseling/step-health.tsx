type HealthData = {
  allergies: string;
  medications: string;
  conditions: string[];
  notes: string;
};

type Props = {
  data: HealthData;
  onChange: (data: HealthData) => void;
};

const CONDITIONS = ["妊娠中", "授乳中", "通院中", "アトピー", "金属アレルギー"];

export function StepHealth({ data, onChange }: Props) {
  const toggleCondition = (condition: string) => {
    const next = data.conditions.includes(condition)
      ? data.conditions.filter((c) => c !== condition)
      : [...data.conditions, condition];
    onChange({ ...data, conditions: next });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold">健康状態・アレルギー</h2>

      <div>
        <label className="block text-sm font-medium mb-1">アレルギー</label>
        <input
          type="text"
          value={data.allergies}
          onChange={(e) => onChange({ ...data, allergies: e.target.value })}
          placeholder="例: 花粉、金属、特定の化粧品成分"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">服用中のお薬</label>
        <input
          type="text"
          value={data.medications}
          onChange={(e) => onChange({ ...data, medications: e.target.value })}
          placeholder="例: なし、血圧の薬"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">該当する項目</label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCondition(c)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors min-h-[44px] ${
                data.conditions.includes(c)
                  ? "bg-accent text-white border-accent"
                  : "bg-surface border-border text-text-light"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">その他の健康に関する備考</label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="気になることがあればご記入ください"
          rows={3}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface resize-none"
        />
      </div>
    </div>
  );
}
