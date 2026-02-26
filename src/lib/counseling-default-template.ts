import type { CounselingTemplate } from "@/types/counseling-template";

/** salons.counseling_template が NULL の場合に使用するデフォルトテンプレート */
export const DEFAULT_COUNSELING_TEMPLATE: CounselingTemplate = {
  sections: [
    {
      id: "health",
      title: "健康状態・アレルギー",
      fields: [
        { id: "allergies", label: "アレルギー", type: "text", placeholder: "例: 花粉、金属、特定の化粧品成分" },
        { id: "medications", label: "服用中のお薬", type: "text", placeholder: "例: なし、血圧の薬" },
        {
          id: "conditions",
          label: "該当する項目",
          type: "checkbox",
          options: ["妊娠中", "授乳中", "通院中", "アトピー", "金属アレルギー"],
        },
        { id: "notes", label: "その他の健康に関する備考", type: "textarea", placeholder: "気になることがあればご記入ください" },
      ],
    },
    {
      id: "treatment",
      title: "施術のご希望",
      fields: [
        { id: "concerns", label: "お悩み・気になる箇所", type: "textarea", placeholder: "例: 肩こりがひどい、肌荒れが気になる" },
        { id: "desired_outcome", label: "理想の仕上がり", type: "text", placeholder: "例: リラックスしたい、ツヤ肌になりたい" },
        {
          id: "frequency",
          label: "ご希望の来店頻度",
          type: "radio",
          options: ["週1回", "2週に1回", "月1回", "2〜3ヶ月に1回", "未定"],
        },
        {
          id: "budget",
          label: "1回あたりの予算目安",
          type: "radio",
          options: ["〜3,000円", "3,000〜5,000円", "5,000〜10,000円", "10,000〜20,000円", "20,000円〜", "未定"],
        },
      ],
    },
    {
      id: "other",
      title: "その他",
      fields: [
        {
          id: "referral_source",
          label: "当サロンを知ったきっかけ",
          type: "radio",
          options: ["Instagram", "ホットペッパー", "知人の紹介", "通りがかり", "その他"],
        },
        { id: "notes", label: "ご質問・ご要望", type: "textarea", placeholder: "何かあればお気軽にご記入ください" },
      ],
    },
  ],
};
