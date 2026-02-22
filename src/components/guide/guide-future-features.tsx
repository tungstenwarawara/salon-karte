/** 今後追加予定の機能セクション */

const FUTURE_FEATURES = [
  { name: "写真一括ダウンロード", desc: "施術写真をZIP形式で一括ダウンロード。サービス移行時やバックアップに" },
  { name: "Web予約ページ", desc: "お客様がスマホから24時間予約できる専用ページを自動生成" },
  { name: "複数スタッフ対応", desc: "スタッフアカウントの追加・閲覧/編集の権限管理" },
];

export function GuideFutureFeatures() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-light">
        以下の機能は、今後の開発を検討しています。
        ご要望に応じて優先度を決めていきますので、気になる機能があればぜひ教えてください。
      </p>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-border">
          {FUTURE_FEATURES.map((feat) => (
            <div key={feat.name} className="p-3">
              <h4 className="font-medium text-sm">{feat.name}</h4>
              <p className="text-xs text-text-light mt-0.5">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
