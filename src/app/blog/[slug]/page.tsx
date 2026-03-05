import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { BrandLogo } from "@/components/ui/brand-logo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "記事が見つかりません" };

  return {
    title: `${post.title} | Salon Karte ブログ`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b border-border/50 bg-white">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" aria-label="トップページ">
            <BrandLogo size="sm" />
          </Link>
          <Link
            href="/signup"
            className="bg-accent hover:bg-accent-light text-white text-sm font-bold rounded-xl px-5 py-2 transition-colors min-h-[44px] flex items-center"
          >
            無料ではじめる
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* パンくず */}
        <nav className="text-sm text-text-light mb-6">
          <Link href="/blog" className="hover:text-accent transition-colors">
            ブログ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">{post.title}</span>
        </nav>

        <article>
          <header className="mb-8">
            <time className="text-sm text-text-light">
              {new Date(post.publishedAt).toLocaleDateString("ja-JP")}
            </time>
            <h1 className="text-2xl md:text-3xl font-bold mt-2 mb-3">
              {post.title}
            </h1>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-surface border border-border text-text-light rounded-lg px-2 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* 記事本文 */}
          <div
            className="prose prose-neutral max-w-none
              prose-headings:font-bold prose-headings:text-text
              prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-text prose-p:leading-relaxed prose-p:mb-4
              prose-li:text-text prose-li:leading-relaxed
              prose-strong:text-text prose-strong:font-bold
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-16 bg-surface border border-border rounded-2xl p-8 text-center">
            <p className="font-bold text-lg mb-2">
              カルテ管理・売上集計・確定申告をもっとラクに
            </p>
            <p className="text-sm text-text-light mb-6">
              Salon Karte は個人サロン専用の管理アプリです
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center bg-accent hover:bg-accent-light text-white font-bold rounded-2xl px-8 py-4 text-lg transition-colors min-h-[48px]"
            >
              無料ではじめる
            </Link>
            <p className="text-xs text-text-light mt-3">
              初期費用0円 / クレジットカード不要 / いつでも解約OK
            </p>
          </div>
        </article>
      </main>

      {/* フッター */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-text-light mt-12">
        <Link href="/" className="hover:text-accent transition-colors">
          Salon Karte トップ
        </Link>
        <span className="mx-2">|</span>
        <Link href="/blog" className="hover:text-accent transition-colors">
          ブログ一覧
        </Link>
        <span className="mx-2">|</span>
        <Link href="/privacy" className="hover:text-accent transition-colors">
          プライバシーポリシー
        </Link>
      </footer>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.publishedAt,
            author: {
              "@type": "Organization",
              name: "Salon Karte",
            },
          }),
        }}
      />
    </div>
  );
}
