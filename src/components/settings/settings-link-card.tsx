import Link from "next/link";

type SettingsLinkCardProps = {
  href: string;
  title: string;
  description: string;
};

/** 設定ページのリンクカード */
export function SettingsLinkCard({ href, title, description }: SettingsLinkCardProps) {
  return (
    <Link
      href={href}
      className="block bg-surface border border-border rounded-2xl p-5 hover:border-accent transition-colors"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-text-light mt-1">{description}</p>
        </div>
        <span className="text-text-light">→</span>
      </div>
    </Link>
  );
}
