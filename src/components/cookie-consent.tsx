"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import Link from "next/link";

const CONSENT_KEY = "cookie_consent";
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export function CookieConsent() {
  const pathname = usePathname();
  const [showBanner, setShowBanner] = useState(false);
  const [loadGa4, setLoadGa4] = useState(false);

  // ダッシュボード内はログイン済み（利用規約同意済み）なのでバナー不要・GA4読み込みOK
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/settings");

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (consent === "accepted" || isDashboard) {
      setLoadGa4(true);
    } else if (consent === null && !isDashboard) {
      setShowBanner(true);
    }
  }, [isDashboard]);

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShowBanner(false);
    setLoadGa4(true);
  }, []);

  const handleDecline = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setShowBanner(false);
  }, []);

  if (!GA4_ID) return null;

  return (
    <>
      {/* GA4: 同意後またはダッシュボード内のみ読み込み */}
      {loadGa4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}');
            `}
          </Script>
        </>
      )}

      {/* Cookie同意バナー（LP等の公開ページのみ） */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
          <div className="max-w-2xl mx-auto bg-white border border-border shadow-lg rounded-2xl p-4 md:p-5">
            <p className="text-sm text-text leading-relaxed mb-3">
              当サイトでは、サービス改善のためにCookieを使用しています。
              「同意する」をクリックすると、
              <Link href="/privacy" className="text-accent hover:underline">
                プライバシーポリシー
              </Link>
              に基づくCookieの使用に同意したものとみなされます。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDecline}
                className="text-sm text-text-light hover:text-text px-4 py-2 min-h-[44px] rounded-xl transition-colors"
              >
                拒否する
              </button>
              <button
                onClick={handleAccept}
                className="bg-accent hover:bg-accent-light text-white text-sm font-medium px-6 py-2 min-h-[44px] rounded-xl transition-colors"
              >
                同意する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
