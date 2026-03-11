export default function SalonHpLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* ヒーロースケルトン */}
      <div className="h-[60vh] bg-gradient-to-b from-[#F5F1ED] to-white" />
      {/* セクションスケルトン */}
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
        <div className="h-8 bg-gray-100 rounded-lg w-48 mx-auto" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}
