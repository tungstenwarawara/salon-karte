type OtherData = {
  referral_source: string;
  notes: string;
};

type Props = {
  data: OtherData;
  onChange: (data: OtherData) => void;
  agreed: boolean;
  onAgreeChange: (agreed: boolean) => void;
};

const REFERRAL_SOURCES = ["Instagram", "ホットペッパー", "知人の紹介", "通りがかり", "その他"];

export function StepOther({ data, onChange, agreed, onAgreeChange }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold">その他</h2>

      <div>
        <label className="block text-sm font-medium mb-1">当サロンを知ったきっかけ</label>
        <select
          value={data.referral_source}
          onChange={(e) => onChange({ ...data, referral_source: e.target.value })}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface min-h-[44px]"
        >
          <option value="">選択してください</option>
          {REFERRAL_SOURCES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ご質問・ご要望</label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="何かあればお気軽にご記入ください"
          rows={3}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface resize-none"
        />
      </div>

      <label className="flex items-start gap-3 p-3 border border-border rounded-lg bg-surface cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreeChange(e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-accent flex-shrink-0"
        />
        <span className="text-xs text-text-light leading-relaxed">
          入力いただいた内容は、施術サービスの向上を目的として当サロンが適切に管理・利用いたします。
        </span>
      </label>
    </div>
  );
}
