/** 記事の目次コンポーネント */

type Heading = { id: string; text: string; level: number };

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;

  return (
    <nav className="bg-[#F5F1ED] rounded-xl p-5 mb-8">
      <p className="text-sm font-bold mb-3 text-text">この記事の内容</p>
      <ol className="space-y-1.5">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block text-sm text-text-light hover:text-accent transition-colors leading-relaxed ${
                h.level === 3 ? "pl-4" : ""
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
