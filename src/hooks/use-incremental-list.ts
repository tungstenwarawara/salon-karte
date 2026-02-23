"use client";

import { useState } from "react";

/**
 * リストの段階的表示フック
 * 「5件 → 15件 → 25件 → ...」と段階的に表示数を増やす
 */
export function useIncrementalList<T>(
  items: T[],
  step: number = 10,
  initial: number = 5,
) {
  const [visibleCount, setVisibleCount] = useState(initial);

  const displayItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const remaining = items.length - visibleCount;
  const isExpanded = visibleCount > initial;

  const showMore = () =>
    setVisibleCount((prev) => Math.min(prev + step, items.length));
  const collapse = () => setVisibleCount(initial);

  return { displayItems, hasMore, remaining, showMore, collapse, isExpanded };
}
