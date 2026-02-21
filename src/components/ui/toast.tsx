"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "success", duration = 2500, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === "success" ? "bg-accent" : "bg-error";

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className={`${bgColor} text-white text-sm font-medium rounded-xl px-5 py-3 shadow-lg flex items-center gap-2`}>
        {type === "success" ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        )}
        {message}
      </div>
    </div>
  );
}

/**
 * Hook to manage toast state
 */
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return { toast, showToast, hideToast };
}

/**
 * sessionStorageベースのフラッシュToast
 * router.push()前にsetFlashToast()を呼び、遷移先で自動表示
 */
const FLASH_TOAST_KEY = "flash_toast";

export function setFlashToast(message: string, type: ToastType = "success") {
  sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify({ message, type }));
}

export function FlashToast() {
  const [flash, setFlash] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(FLASH_TOAST_KEY);
    if (stored) {
      sessionStorage.removeItem(FLASH_TOAST_KEY);
      setFlash(JSON.parse(stored));
    }
  }, []);

  if (!flash) return null;

  return <Toast message={flash.message} type={flash.type} onClose={() => setFlash(null)} />;
}
