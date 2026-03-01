/** 機能一覧 — カテゴリ別グリッド */

type Feature = {
  title: string;
  desc: string;
};

type Category = {
  name: string;
  color: string;
  dotColor: string;
  features: Feature[];
};

const CATEGORIES: Category[] = [
  {
    name: "顧客・カルテ",
    color: "text-[#c4766a]",
    dotColor: "bg-[#E4A89E]",
    features: [
      { title: "顧客管理", desc: "名前・カナ・電話番号・アレルギー・施術目標を管理。検索・来店回数・最終来店日も表示。来店間隔でのフィルターや卒業済み除外にも対応。" },
      { title: "施術記録（カルテ）", desc: "施術日・メニュー・部位・使用化粧品/機器・施術前後の状態・会話メモ・注意事項・次回への申し送りを記録。テキスト欄は自動拡張。期間フィルター・検索にも対応。" },
      { title: "写真管理", desc: "施術前後の写真を撮影・保存。ビフォーアフター比較表示対応。位置情報は自動除去。顧客単位でZIP一括ダウンロードも可能。" },
      { title: "カルテPDF出力", desc: "施術記録を印刷用PDFとして出力。お客様への施術報告書や紙での保管にも対応。ワンタップで作成。" },
      { title: "物販購入管理", desc: "商品から選ぶモード（売価自動入力・在庫連動）と自由入力モードに対応。お客様ごとに購入履歴を時系列で管理。" },
      { title: "回数券（コースチケット）", desc: "残回数をワンタップで消化。有効期限設定・手動調整にも対応。顧客詳細で残数をひと目で確認。" },
    ],
  },
  {
    name: "予約・LINE・問診",
    color: "text-[#5a9474]",
    dotColor: "bg-[#8BBFA8]",
    features: [
      { title: "予約管理", desc: "日付・時間・お客様・メニューで予約登録。メニュー複数選択で終了時間を自動計算。空き時間の可視化、重複チェック、営業時間外の警告に対応。予約元（ホットペッパー/電話/LINE等）も記録。" },
      { title: "LINE連携", desc: "LINE公式アカウントと接続。予約確認通知・前日リマインドを自動送信。友だち追加検知や顧客との紐付け管理に対応。" },
      { title: "カウンセリングシート", desc: "デジタル問診票。テンプレートは「設定」で作成し、顧客詳細または予約詳細からシートを発行。QRコード・リンクで共有でき、回答は自動保存。有効期限付き。" },
      { title: "来店分析・離脱アラート", desc: "60日以上来店のないお客様をダッシュボードに表示。フォロー済みは「卒業」として非表示にできます。" },
    ],
  },
  {
    name: "経営・売上・在庫",
    color: "text-[#8a6080]",
    dotColor: "bg-[#C4A0B8]",
    features: [
      { title: "売上レポート", desc: "施術・物販・回数券の3カテゴリで月別売上をグラフ表示。月タップで日別詳細。年切り替えで過去の売上も確認。" },
      { title: "売上分析", desc: "顧客LTVランキング、新規/リピーター月別推移、メニュー別人気ランキング。データが蓄積されるほど経営判断に活用。" },
      { title: "在庫管理", desc: "商品マスタ登録・仕入れ（入庫）・サンプル消費/廃棄・棚卸しに対応。物販時に在庫自動減算。発注点以下でダッシュボードにアラート。" },
      { title: "確定申告サポート", desc: "年間の施術・物販・回数券売上、仕入高・棚卸高・売上原価を自動計算。freee・弥生・汎用の3形式でCSV出力。" },
    ],
  },
  {
    name: "設定・管理",
    color: "text-accent",
    dotColor: "bg-accent",
    features: [
      { title: "営業時間・不定休設定", desc: "曜日ごとの営業ON/OFFと時間を設定。不定休はカレンダーで日付タップ。予約画面での空き時間可視化・営業時間外警告に活用。" },
      { title: "スタッフ管理", desc: "スタッフの追加・ロール（オーナー/マネージャー/スタッフ）設定。シフト管理で個別の勤務時間も登録可能。" },
      { title: "予約ルール設定", desc: "予約の受付条件（最小間隔・同時間枠数など）をカスタマイズ。サロンの運用に合わせた予約管理が可能。" },
      { title: "CSV入出力", desc: "顧客・施術記録・商品・予約・回数券のCSV出力に対応。他サービスからの乗り換え時にCSV一括取り込みも可能。" },
    ],
  },
];

export function GuideFeatureGrid() {
  return (
    <div id="features" className="scroll-mt-20">
      <h3 className="font-bold text-base mb-4">機能の詳細</h3>

      <div className="space-y-6">
        {CATEGORIES.map(({ name, color, dotColor, features }) => (
          <div key={name}>
            {/* カテゴリヘッダー */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
              <h4 className={`font-bold text-sm ${color}`}>{name}</h4>
              <span className="text-[10px] text-text-light">
                {features.length}機能
              </span>
            </div>

            {/* 機能カード */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {features.map(({ title, desc }) => (
                <div
                  key={title}
                  className="bg-surface border border-border rounded-xl p-3"
                >
                  <h5 className="font-medium text-sm">{title}</h5>
                  <p className="text-xs text-text-light mt-1 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
