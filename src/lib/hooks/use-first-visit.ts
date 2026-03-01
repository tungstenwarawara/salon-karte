"use client";

import { useCallback, useState, useEffect } from "react";

/**
 * 初回訪問を管理するフック
 * localStorageに訪問フラグを保存し、初回のみtrueを返す
 */
export function useFirstVisit(key: string) {
  const storageKey = `visited_${key}`;
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    try {
      const visited = localStorage.getItem(storageKey);
      if (!visited) {
        setIsFirstVisit(true);
      }
    } catch {
      // localStorage不可時は無視
    }
  }, [storageKey]);

  const markVisited = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
      setIsFirstVisit(false);
    } catch {
      // localStorage不可時は無視
    }
  }, [storageKey]);

  return { isFirstVisit, markVisited };
}

/**
 * 1回限りのイベントフラグ管理
 * お祝い表示など、1度だけ実行したいイベントに使用
 */
export function useOnceFlag(key: string) {
  const storageKey = `once_${key}`;

  const shouldShow = useCallback(() => {
    try {
      return !localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  }, [storageKey]);

  const markDone = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // 無視
    }
  }, [storageKey]);

  return { shouldShow, markDone };
}
