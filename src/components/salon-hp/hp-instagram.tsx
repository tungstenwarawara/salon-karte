type Props = {
  instagram: string | null;
  salonName: string;
};

export function HpInstagram({ instagram, salonName }: Props) {
  if (!instagram) return null;

  const handle = instagram.replace("@", "");
  const url = `https://instagram.com/${handle}`;

  return (
    <section className="py-20 md:py-28 hp-section">
      <div className="max-w-3xl mx-auto px-4 text-center">
        {/* 装飾線 */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#C4956A]/30" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#C4956A]/40" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#C4956A]/30" />
        </div>

        <p className="text-xs tracking-[0.3em] text-[#C4956A] mb-6 uppercase">Instagram</p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          最新の施術事例を公開中
        </h2>
        <p className="text-gray-500 mb-10 leading-relaxed max-w-md mx-auto">
          {salonName}の日々の施術やサロンの雰囲気を
          <br className="hidden md:inline" />
          Instagramでご覧いただけます。
        </p>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white font-bold rounded-full px-10 py-4 text-base transition-all duration-300 min-h-[56px] shadow-lg"
        >
          {/* Instagram アイコン */}
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          @{handle} をフォロー
        </a>

        <p className="text-xs text-gray-400 mt-4">
          施術のビフォーアフターも掲載しています
        </p>
      </div>
    </section>
  );
}
