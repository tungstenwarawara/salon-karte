type Props = {
  items: string[];
};

/** Claude Design: 横スクロールマーキー帯 (38秒線形ループ) */
export function HpMarquee({ items }: Props) {
  // 2セット繰り返してシームレスループ
  const loop = [...items, ...items];
  return (
    <div
      className="border-y border-[color:var(--line)] overflow-hidden py-[22px] bg-[color:var(--bg)]"
      aria-hidden="true"
    >
      <div className="marquee-track flex gap-[60px] whitespace-nowrap">
        {loop.map((s, i) => (
          <span
            key={i}
            className="font-serif-en italic font-light text-2xl md:text-[26px] tracking-wide text-[color:var(--ink)]"
          >
            {s}
            <span className="text-[color:var(--accent)] ml-[60px]">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
