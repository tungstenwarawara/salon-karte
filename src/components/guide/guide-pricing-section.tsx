/** 料金プラン比較セクション */
export function GuidePricingSection() {
  return (
    <div className="space-y-4">
      {/* テスター特典 */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">テスター特典</span>
        </div>
        <p className="text-sm leading-relaxed">
          テスター期間中は<strong>全機能を無料</strong>でお使いいただけます。
          正式リリース後も、オプション機能は<strong>3ヶ月間無料</strong>でお試しいただけます。
        </p>
      </div>

      {/* 基本プラン */}
      <div className="bg-surface border-2 border-accent rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm">基本プラン</h4>
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
            "予約管理（営業日設定・空き時間表示・重複チェック）",
            "物販購入履歴の管理",
            "回数券・コースチケット管理",
            "売上集計（施術・物販・回数券）・月別グラフ",
            "来店分析・離脱アラート",
            "在庫管理（商品マスタ・仕入・棚卸し・在庫アラート）",
            "確定申告レポート・CSV出力（freee/弥生/汎用）",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-accent mt-0.5">&#10003;</span><span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* お試しプラン */}
      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm">お試しプラン</h4>
          <div className="text-right">
            <span className="text-xl font-bold">0</span>
            <span className="text-xs text-text-light">円</span>
          </div>
        </div>
        <p className="text-sm text-text-light">顧客10件まで。写真保存・予約管理なし。まずは試してみたい方向け。</p>
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
          サロンカルテは初期費用0円。物販・回数券・在庫管理・確定申告サポートが基本料金に含まれるのはほぼ唯一です。
          必要な機能だけ選べるので、不要なオプションにお金を払う必要はありません。
        </p>
      </div>
    </div>
  );
}
