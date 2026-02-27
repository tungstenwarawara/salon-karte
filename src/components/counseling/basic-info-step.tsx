"use client";

export type CustomerInfo = {
  last_name: string;
  first_name: string;
  last_name_kana: string;
  first_name_kana: string;
  phone: string;
  email: string;
  gender: string;
  birth_date: string;
};

type Props = {
  data: CustomerInfo;
  onChange: (data: CustomerInfo) => void;
};

export function BasicInfoStep({ data, onChange }: Props) {
  const update = (key: keyof CustomerInfo, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-base">基本情報</h3>
      <p className="text-xs text-text-light">お名前は必須です。その他は任意でご入力ください。</p>

      {/* 氏名 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">姓 <span className="text-red-500">*</span></label>
          <input type="text" value={data.last_name} onChange={(e) => update("last_name", e.target.value)} placeholder="山田" className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]" required />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">名 <span className="text-red-500">*</span></label>
          <input type="text" value={data.first_name} onChange={(e) => update("first_name", e.target.value)} placeholder="花子" className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]" required />
        </div>
      </div>

      {/* フリガナ */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">セイ</label>
          <input type="text" value={data.last_name_kana} onChange={(e) => update("last_name_kana", e.target.value)} placeholder="ヤマダ" className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">メイ</label>
          <input type="text" value={data.first_name_kana} onChange={(e) => update("first_name_kana", e.target.value)} placeholder="ハナコ" className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]" />
        </div>
      </div>

      {/* 電話番号 */}
      <div>
        <label className="text-sm font-medium block mb-1">電話番号</label>
        <input type="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="090-1234-5678" className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]" />
      </div>

      {/* メールアドレス */}
      <div>
        <label className="text-sm font-medium block mb-1">メールアドレス</label>
        <input type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="example@email.com" className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]" />
      </div>

      {/* 性別 */}
      <div>
        <label className="text-sm font-medium block mb-1">性別</label>
        <div className="flex gap-4">
          {[{ value: "female", label: "女性" }, { value: "male", label: "男性" }, { value: "other", label: "その他" }].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
              <input type="radio" name="gender" value={opt.value} checked={data.gender === opt.value} onChange={(e) => update("gender", e.target.value)} className="w-4 h-4 accent-accent" />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* 生年月日 */}
      <div>
        <label className="text-sm font-medium block mb-1">生年月日</label>
        <input type="date" value={data.birth_date} onChange={(e) => update("birth_date", e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px]" />
      </div>
    </div>
  );
}
