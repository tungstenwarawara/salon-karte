type Props = {
  instagram: string | null;
  salonName: string;
};

/** NANA系: 重い塗りボタンを排除、テキストリンク + em-dash 装飾 */
export function HpInstagram({ instagram, salonName }: Props) {
  if (!instagram) return null;

  // 入力が完全URL/ハンドルのいずれでも対応
  const trimmed = instagram.trim();
  let handle: string;
  let url: string;
  if (trimmed.startsWith("http")) {
    url = trimmed;
    handle = trimmed
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
      .replace(/\/$/, "")
      .replace(/^@/, "");
  } else {
    handle = trimmed.replace(/^@/, "");
    url = `https://instagram.com/${handle}`;
  }

  return (
    <section className="py-24 md:py-32 hp-section bg-white">
      <div className="max-w-3xl mx-auto px-5 md:px-10 text-center">
        <p className="text-[10px] tracking-[0.4em] text-[#9B7A52] uppercase mb-4">Instagram</p>
        <h2
          className="text-2xl md:text-[1.6rem] font-light tracking-[0.1em] text-gray-800 mb-6"
          style={{ fontFamily: '"Noto Serif JP", "Hiragino Mincho ProN", serif' }}
        >
          最新の施術事例を公開中
        </h2>
        <p className="text-sm text-gray-500 leading-[2] tracking-wider mb-12 max-w-md mx-auto">
          {salonName} の日々の施術風景・サロンの空気感を
          <br className="hidden md:inline" />
          Instagramで発信しています。
        </p>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-3 text-[11px] tracking-[0.3em] text-[#9B7A52] uppercase hover:text-gray-900 transition-colors min-h-[44px]"
        >
          <span className="w-8 h-px bg-current" />
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          Follow @{handle}
          <svg
            className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </a>
      </div>
    </section>
  );
}
