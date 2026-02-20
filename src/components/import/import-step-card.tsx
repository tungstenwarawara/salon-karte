import Link from "next/link";

type Status = "done" | "available" | "skippable" | "locked";

export function ImportStepCard({
  stepNumber,
  title,
  description,
  status,
  href,
  count,
  lockReason,
  skipNote,
}: {
  stepNumber: number;
  title: string;
  description: string;
  status: Status;
  href: string;
  count?: number;
  lockReason?: string;
  skipNote?: string;
}) {
  const isClickable = status !== "locked";

  const content = (
    <div
      className={`border rounded-2xl p-4 transition-colors ${
        status === "done"
          ? "bg-green-50 border-green-200"
          : status === "locked"
            ? "bg-gray-50 border-border opacity-60"
            : "bg-surface border-border hover:border-accent"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* ステップ番号 */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
            status === "done"
              ? "bg-success text-white"
              : status === "locked"
                ? "bg-border text-text-light"
                : "bg-accent/10 text-accent"
          }`}
        >
          {status === "done" ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : (
            stepNumber
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{title}</h3>
            {isClickable && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-text-light shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </div>
          <p className="text-sm text-text-light mt-0.5">{description}</p>

          {status === "done" && count !== undefined && (
            <p className="text-xs text-success font-medium mt-1.5">{count}件登録済み</p>
          )}
          {status === "locked" && lockReason && (
            <p className="text-xs text-text-light mt-1.5">🔒 {lockReason}</p>
          )}
          {status === "skippable" && skipNote && (
            <p className="text-xs text-text-light mt-1.5">{skipNote}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (isClickable) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
