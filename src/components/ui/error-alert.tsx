"use client";

import { useEffect, useRef } from "react";

interface ErrorAlertProps {
  message: string;
}

/**
 * Error alert component that auto-scrolls into view when rendered.
 * Drop-in replacement for inline error divs.
 */
export function ErrorAlert({ message }: ErrorAlertProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [message]);

  return (
    <div
      ref={ref}
      className="bg-error/10 text-error text-sm rounded-lg p-3"
    >
      {message}
    </div>
  );
}
