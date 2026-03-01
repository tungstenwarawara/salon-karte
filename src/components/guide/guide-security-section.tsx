/** セキュリティセクション — シールドアイコン付き */

const MEASURES = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: "通信の暗号化",
    desc: "すべてのデータはHTTPS（SSL/TLS）で暗号化されて送受信",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "アクセス制御",
    desc: "他のサロンのデータは一切閲覧・編集不可",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 20.25 4.5H3.75A2.25 2.25 0 0 0 1.5 6.75v10.5A2.25 2.25 0 0 0 3.75 21Z" />
      </svg>
    ),
    title: "写真の保護",
    desc: "暗号化された非公開ストレージに保存。1時間で期限切れの一時URLでのみ表示",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    title: "位置情報の除去",
    desc: "写真のGPS・デバイス情報はアップロード時に自動除去",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    title: "データポータビリティ",
    desc: "CSVでいつでもエクスポート可能。あなたのデータを人質にしません",
  },
];

export function GuideSecuritySection() {
  return (
    <div id="security" className="scroll-mt-20">
      <h3 className="font-bold text-base mb-4">セキュリティについて</h3>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <p className="text-xs text-text-light leading-relaxed mb-4">
          お客様の大切な個人情報を安全に保護するため、以下の対策を行っています。
        </p>
        <div className="space-y-3">
          {MEASURES.map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center mt-0.5">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{title}</h4>
                <p className="text-xs text-text-light mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
