"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "success", duration = 3500, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);
  // onCloseをrefで安定化（useEffectの不要な再実行を防止）
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onCloseRef.current(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

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
 *
 * useSyncExternalStore方式:
 * - モジュールスコープの外部ストアでToastデータを管理
 * - Reactが公式に推奨する外部ストア連携パターン
 * - Server Component内のClient Componentでも確実に再レンダリングが発火する
 */
const FLASH_TOAST_KEY = "flash_toast";

// --- 外部ストア ---
type FlashData = { message: string; type: ToastType } | null;
let _flashData: FlashData = null;
const _listeners = new Set<() => void>();

function emitChange() {
  _listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function getSnapshot(): FlashData {
  return _flashData;
}

function getServerSnapshot(): FlashData {
  return null;
}

function setFlashData(data: FlashData) {
  _flashData = data;
  emitChange();
}

// --- 公開API ---

/** router.push()の前に呼ぶ。遷移先でToastを自動表示 */
export function setFlashToast(message: string, type: ToastType = "success") {
  // sessionStorageに保存（フルリロード対応）
  sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify({ message, type }));
  // 遷移完了後にストアを更新
  setTimeout(() => {
    const stored = sessionStorage.getItem(FLASH_TOAST_KEY);
    if (stored) {
      sessionStorage.removeItem(FLASH_TOAST_KEY);
      setFlashData(JSON.parse(stored) as FlashData);
    }
  }, 150);
}

/**
 * FlashToast表示コンポーネント（layoutに配置）
 * useSyncExternalStoreで外部ストアを購読し、確実に再レンダリングする
 */
export function FlashToast() {
  const flash = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleClose = useCallback(() => {
    setFlashData(null);
  }, []);

  // マウント時にsessionStorageをチェック（フルリロード対応）
  useEffect(() => {
    const stored = sessionStorage.getItem(FLASH_TOAST_KEY);
    if (stored) {
      sessionStorage.removeItem(FLASH_TOAST_KEY);
      setFlashData(JSON.parse(stored) as FlashData);
    }
  }, []);

  return (
    <div id="flash-toast-container">
      {flash && (
        <Toast message={flash.message} type={flash.type} onClose={handleClose} />
      )}
    </div>
  );
}
