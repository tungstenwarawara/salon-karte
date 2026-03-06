import Link from "next/link";

type SettingsLinkCardProps = {
  href: string;
  title: string;
  description: string;
  badge?: string;
};

/** 設定ページのリンクカード */
export function SettingsLinkCard({ href, title, description, badge }: SettingsLinkCardProps) {
  return (
    <Link
      href={href}
      className="block bg-surface border border-border rounded-2xl p-5 hover:border-accent hover:shadow-sm active:scale-[0.98] transition-all duration-200"
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold">{title}</h3>
            {badge && (
              <span className="text-[11px] bg-accent/10 text-accent font-medium px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-text-light mt-1">{description}</p>
        </div>
        <span className="text-text-light">→</span>
      </div>
    </Link>
  );
}
