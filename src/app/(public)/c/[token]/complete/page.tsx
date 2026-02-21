export default function CompletePage() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-4">
      <div className="text-4xl">✓</div>
      <h1 className="text-xl font-bold">ご回答ありがとうございます</h1>
      <p className="text-sm text-text-light">
        カウンセリングシートの内容はサロンに送信されました。
        <br />
        ご来店時に担当者が確認いたします。
      </p>
      <p className="text-xs text-text-light mt-4">このページは閉じていただいて構いません。</p>
    </div>
  );
}
