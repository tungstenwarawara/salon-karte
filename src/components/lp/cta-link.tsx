"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import type { ComponentProps } from "react";

type CtaLinkProps = ComponentProps<typeof Link> & {
  /** GA4 イベントの location パラメータ（例: "hero", "pricing", "final_cta"） */
  trackingLocation: string;
  /** GA4 イベントの label パラメータ（例: "無料ではじめる"） */
  trackingLabel: string;
};

/** LP の CTA リンク。クリック時に GA4 cta_click イベントを送信する */
export function CtaLink({
  trackingLocation,
  trackingLabel,
  onClick,
  ...props
}: CtaLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent({
      name: "cta_click",
      params: { location: trackingLocation, label: trackingLabel },
    });
    if (onClick) onClick(e);
  };

  return <Link {...props} onClick={handleClick} />;
}
