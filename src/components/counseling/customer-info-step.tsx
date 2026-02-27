"use client";

import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";

// 公開カウンセリングフォームで収集する顧客情報（notes除く全フィールド）
export type PublicCustomerInfo = {
  last_name: string;
  first_name: string;
  last_name_kana: string;
  first_name_kana: string;
  birth_date: string;
  phone: string;
  email: string;
  address: string;
  marital_status: string;
  has_children: string;
  dm_allowed: string;
  height_cm: string;
  weight_kg: string;
  allergies: string;
  treatment_goal: string;
};

export const emptyPublicCustomerInfo: PublicCustomerInfo = {
  last_name: "", first_name: "",
  last_name_kana: "", first_name_kana: "",
  birth_date: "", phone: "", email: "", address: "",
  marital_status: "", has_children: "", dm_allowed: "true",
  height_cm: "", weight_kg: "",
  allergies: "", treatment_goal: "",
};

type Props = {
  data: PublicCustomerInfo;
  onChange: (data: PublicCustomerInfo) => void;
};

const inputClass =
  "w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[44px] bg-white";
const labelClass = "text-sm font-medium block mb-1";

export function CustomerInfoStep({ data, onChange }: Props) {
  const update = (key: keyof PublicCustomerInfo, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-5">
      <h3 className="font-bold text-base">お客様情報</h3>
      <p className="text-xs text-text-light">お名前は必須です。その他は任意でご入力ください。</p>

      {/* 基本情報 */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-text-light border-b border-border pb-1">基本情報</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>姓 <span className="text-red-500">*</span></label>
            <input type="text" value={data.last_name} onChange={(e) => update("last_name", e.target.value)} placeholder="山田" className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>名 <span className="text-red-500">*</span></label>
            <input type="text" value={data.first_name} onChange={(e) => update("first_name", e.target.value)} placeholder="花子" className={inputClass} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>セイ</label>
            <input type="text" value={data.last_name_kana} onChange={(e) => update("last_name_kana", e.target.value)} placeholder="ヤマダ" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>メイ</label>
            <input type="text" value={data.first_name_kana} onChange={(e) => update("first_name_kana", e.target.value)} placeholder="ハナコ" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>生年月日</label>
          <input type="date" value={data.birth_date} onChange={(e) => update("birth_date", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>電話番号</label>
          <input type="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="090-1234-5678" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>メールアドレス</label>
          <input type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="example@email.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>住所</label>
          <input type="text" value={data.address} onChange={(e) => update("address", e.target.value)} placeholder="東京都渋谷区..." className={inputClass} />
        </div>
      </div>

      {/* 属性情報 */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-text-light border-b border-border pb-1">ご家族・連絡について</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>婚姻状況</label>
            <select value={data.marital_status} onChange={(e) => update("marital_status", e.target.value)} className={inputClass}>
              <option value="">選択してください</option>
              <option value="未婚">未婚</option>
              <option value="既婚">既婚</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>お子様</label>
            <select value={data.has_children} onChange={(e) => update("has_children", e.target.value)} className={inputClass}>
              <option value="">選択してください</option>
              <option value="true">あり</option>
              <option value="false">なし</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>DM送付</label>
          <select value={data.dm_allowed} onChange={(e) => update("dm_allowed", e.target.value)} className={inputClass}>
            <option value="true">可</option>
            <option value="false">不可</option>
          </select>
        </div>
      </div>

      {/* 施術関連 */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-text-light border-b border-border pb-1">施術に関する情報</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>身長 (cm)</label>
            <input type="number" step="0.1" value={data.height_cm} onChange={(e) => update("height_cm", e.target.value)} placeholder="160" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>体重 (kg)</label>
            <input type="number" step="0.1" value={data.weight_kg} onChange={(e) => update("weight_kg", e.target.value)} placeholder="55" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>アレルギー・注意事項</label>
          <AutoResizeTextarea value={data.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="アレルギーや施術時の注意事項" minRows={2} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>施術のご希望・目標</label>
          <AutoResizeTextarea value={data.treatment_goal} onChange={(e) => update("treatment_goal", e.target.value)} placeholder="施術に対するご希望や目標" minRows={2} className={inputClass} />
        </div>
      </div>
    </div>
  );
}
