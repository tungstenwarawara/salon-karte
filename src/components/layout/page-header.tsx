import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
};

export function PageHeader({ title, breadcrumbs, children }: PageHeaderProps) {
  return (
    <div className="mb-4">
      {/* パンくず */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-text-light mb-2 overflow-x-auto" aria-label="パンくずリスト">
          {breadcrumbs.map((item, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              {i > 0 && <span className="text-border mx-0.5">›</span>}
              {item.href ? (
                <Link href={item.href} className="hover:text-accent transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-text font-medium">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* ヘッダー行 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold truncate">{title}</h2>
        {children && <div className="shrink-0 ml-2">{children}</div>}
      </div>
    </div>
  );
}
