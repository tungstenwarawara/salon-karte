import { LoadingIllustration } from "@/components/ui/loading-illustration";

export default function SettingsLoading() {
  return (
    <LoadingIllustration type="clipboard">
      {/* ヘッダー */}
      <div>
        <div className="h-7 w-16 skeleton rounded-lg" />
      </div>
      {/* 設定セクション */}
      <div className="space-y-3 mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton border border-border rounded-2xl p-4 h-16" />
        ))}
      </div>
    </LoadingIllustration>
  );
}
