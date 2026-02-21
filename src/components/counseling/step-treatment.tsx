type TreatmentData = {
  concerns: string;
  desired_outcome: string;
  frequency: string;
  budget: string;
};

type Props = {
  data: TreatmentData;
  onChange: (data: TreatmentData) => void;
};

const FREQUENCIES = ["週1回", "2週に1回", "月1回", "2〜3ヶ月に1回", "未定"];
const BUDGETS = ["〜3,000円", "3,000〜5,000円", "5,000〜10,000円", "10,000〜20,000円", "20,000円〜", "未定"];

export function StepTreatment({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold">施術のご希望</h2>

      <div>
        <label className="block text-sm font-medium mb-1">お悩み・気になる箇所</label>
        <textarea
          value={data.concerns}
          onChange={(e) => onChange({ ...data, concerns: e.target.value })}
          placeholder="例: 肩こりがひどい、肌荒れが気になる"
          rows={3}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">理想の仕上がり</label>
        <input
          type="text"
          value={data.desired_outcome}
          onChange={(e) => onChange({ ...data, desired_outcome: e.target.value })}
          placeholder="例: リラックスしたい、ツヤ肌になりたい"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ご希望の来店頻度</label>
        <select
          value={data.frequency}
          onChange={(e) => onChange({ ...data, frequency: e.target.value })}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface min-h-[44px]"
        >
          <option value="">選択してください</option>
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">1回あたりの予算目安</label>
        <select
          value={data.budget}
          onChange={(e) => onChange({ ...data, budget: e.target.value })}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface min-h-[44px]"
        >
          <option value="">選択してください</option>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
