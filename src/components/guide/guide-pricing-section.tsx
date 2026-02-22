/** 料金プラン比較セクション */
export function GuidePricingSection() {
  return (
    <div className="space-y-4">
      {/* スタンダードプラン */}
      <div className="bg-surface border-2 border-accent rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm">スタンダードプラン</h4>
          <div className="text-right">
            <span className="text-xl font-bold text-accent">2,980</span>
            <span className="text-xs text-text-light">円/月（税込）</span>
          </div>
        </div>
        <ul className="space-y-1.5 text-sm text-text-light">
          {[
            "顧客管理（人数無制限）",
            "施術記録（カルテ）・枚数無制限",
            "ビフォーアフター写真の保存（5GB）",
            "カルテPDF出力",
            "予約管理（営業日設定・空き時間表示・重複チェック）",
            "LINE連携（予約リマインド・来店促進メッセージ）",
            "カウンセリングシート（デジタル問診票・QRコード共有）",
            "物販購入履歴の管理",
            "回数券・コースチケット管理",
            "売上集計（施術・物販・回数券）・月別グラフ",
            "売上分析（顧客LTV・リピート率・メニュー別ランキング）",
            "来店分析・離脱アラート",
            "在庫管理（商品マスタ・仕入・棚卸し・在庫アラート）",
            "確定申告レポート・CSV出力（freee/弥生/汎用）",
            "データエクスポート/インポート（CSV）",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-accent mt-0.5">&#10003;</span><span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-text-light">
            オプション：写真容量アップ（5GB → 20GB）<strong className="text-text">+500円/月</strong>
          </p>
        </div>
      </div>

      {/* おためしプラン */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm">おためしプラン</h4>
          <div className="text-right">
            <span className="text-xl font-bold">0</span>
            <span className="text-xs text-text-light">円</span>
          </div>
        </div>
        <p className="text-sm text-text-light leading-relaxed">
          まずは試してみたい方向け。顧客10件・カルテ1顧客あたり5件・予約月20件まで。
          写真保存・LINE連携・カウンセリングシート・売上分析・カルテPDF出力は含まれません。
        </p>
      </div>

      {/* 他社比較 */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <h4 className="font-bold text-sm mb-3">他のサービスとの比較</h4>
        <div className="space-y-2 text-sm">
          {[
            { name: "KaruteKun", price: "月額 5,500円〜" },
            { name: "Bionly", price: "月額 10,780円〜" },
            { name: "coming-soon", price: "月額 14,300円〜" },
            { name: "リザービア", price: "月額 21,000円〜" },
          ].map(({ name, price }) => (
            <div key={name} className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-text-light">{name}</span>
              <span className="font-medium">{price}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-1.5 bg-accent/5 rounded-lg px-2">
            <span className="font-bold text-accent">サロンカルテ</span>
            <span className="font-bold text-accent">月額 2,980円</span>
          </div>
        </div>
        <p className="text-xs text-text-light mt-3">
          サロンカルテは初期費用0円。LINE連携・カウンセリングシート・売上分析・在庫管理・確定申告サポートが月額2,980円に全て含まれています。
        </p>
      </div>
    </div>
  );
}
