"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  backLabel?: string;
  backHref?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
};

export function PageHeader({ title, backLabel, backHref, breadcrumbs, children }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className="mb-4">
      {/* Breadcrumbs */}
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

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {(backLabel || backHref) && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-accent hover:underline shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              {backLabel && <span>{backLabel}</span>}
            </button>
          )}
          <h2 className="text-xl font-bold truncate">{title}</h2>
        </div>
        {children && <div className="shrink-0 ml-2">{children}</div>}
      </div>
    </div>
  );
}
