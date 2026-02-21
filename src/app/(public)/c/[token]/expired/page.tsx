export default function ExpiredPage() {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-4">
      <div className="text-4xl">⏰</div>
      <h1 className="text-xl font-bold">有効期限が切れています</h1>
      <p className="text-sm text-text-light">
        このカウンセリングシートの有効期限が過ぎました。
        <br />
        サロンにご連絡いただき、新しいリンクを発行してもらってください。
      </p>
    </div>
  );
}
