import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug, BLOG_CATEGORIES } from "@/lib/blog";
import { BlogHeader } from "@/components/blog/blog-header";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { LpFooter } from "@/components/lp/lp-footer";
import { CtaLink } from "@/components/lp/cta-link";
import { BlogScrollTracker } from "@/components/blog/blog-scroll-tracker";

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

  const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://salonkarte.com"}/blog/${post.slug}`;

  return {
    title: `${post.title} | Salon Karte ブログ`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      url,
      siteName: "Salon Karte",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const cat = BLOG_CATEGORIES[post.category];
  const allPosts = getAllPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://salonkarte.com";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BlogScrollTracker slug={post.slug} title={post.title} />
      <BlogHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 md:py-12 w-full">
        {/* パンくず */}
        <nav className="text-sm text-text-light mb-6 flex items-center gap-2">
          <Link
            href="/blog"
            className="hover:text-accent transition-colors"
          >
            ブログ
          </Link>
          <span className="text-border">/</span>
          <span className="text-text line-clamp-1">{post.title}</span>
        </nav>

        <article>
          {/* ヒーロー */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`text-xs font-medium rounded-lg px-2.5 py-1 ${cat.color}`}
              >
                {cat.label}
              </span>
              <span className="text-xs text-text-light">
                {post.readingTime}分で読める
              </span>
            </div>

            <span className="text-5xl mb-4 block">{post.emoji}</span>

            <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-text-light">
              <time>
                {new Date(post.publishedAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
          </header>

          {/* 目次 */}
          <TableOfContents headings={post.headings} />

          {/* 記事本文 */}
          <div
            className="blog-content prose prose-neutral max-w-none
              prose-headings:font-bold prose-headings:text-text prose-headings:tracking-tight
              prose-h2:text-xl prose-h2:mt-14 prose-h2:mb-5 prose-h2:pb-2
              prose-h3:text-lg prose-h3:mt-10 prose-h3:mb-4
              prose-p:text-text prose-p:leading-[1.9] prose-p:mb-6
              prose-li:text-text prose-li:leading-[1.85]
              prose-strong:text-text prose-strong:font-bold
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-ul:my-5 prose-ol:my-5
              prose-blockquote:border-l-3 prose-blockquote:border-accent prose-blockquote:bg-[#F5F1ED]/60 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:my-6
              prose-blockquote:not-italic
              prose-hr:border-border prose-hr:my-10"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* 記事下CTA */}
          <div className="mt-16 bg-gradient-to-br from-[#F5F1ED] to-background border border-border rounded-2xl p-8 text-center">
            <p className="font-bold text-lg mb-2">
              カルテ管理・売上集計・確定申告をもっとラクに
            </p>
            <p className="text-sm text-text-light mb-6">
              Salon Karte は個人サロン専用の管理アプリです
            </p>
            <CtaLink
              href="/signup"
              trackingLocation="blog_article"
              trackingLabel="無料ではじめる"
              className="inline-flex items-center bg-accent hover:bg-accent-light text-white font-bold rounded-2xl px-8 py-4 text-lg transition-colors min-h-[48px]"
            >
              無料ではじめる
            </CtaLink>
            <p className="text-xs text-text-light mt-3">
              初期費用0円 / クレジットカード不要 / いつでも解約OK
            </p>
          </div>

          {/* 関連記事 */}
          {relatedPosts.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-bold mb-4">あわせて読みたい</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedPosts.map((rp) => {
                  const rpCat = BLOG_CATEGORIES[rp.category];
                  return (
                    <Link
                      key={rp.slug}
                      href={`/blog/${rp.slug}`}
                      className="flex gap-4 items-start bg-surface border border-border rounded-xl p-4 hover:border-accent/40 transition-colors"
                    >
                      <span className="text-3xl leading-none shrink-0">
                        {rp.emoji}
                      </span>
                      <div className="min-w-0">
                        <span
                          className={`text-xs font-medium rounded px-1.5 py-0.5 ${rpCat.color}`}
                        >
                          {rpCat.label}
                        </span>
                        <p className="text-sm font-bold mt-1 line-clamp-2 leading-snug">
                          {rp.title}
                        </p>
                        <p className="text-xs text-text-light mt-1">
                          {rp.readingTime}分で読める
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </article>
      </main>

      <LpFooter />

      {/* JSON-LD: BlogPosting + BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.title,
              description: post.description,
              datePublished: post.publishedAt,
              dateModified: post.publishedAt,
              wordCount: post.content.replace(/<[^>]*>/g, "").length,
              author: {
                "@type": "Organization",
                name: "Salon Karte",
                url: appUrl,
              },
              publisher: {
                "@type": "Organization",
                name: "Salon Karte",
              },
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `${appUrl}/blog/${post.slug}`,
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "トップ",
                  item: appUrl,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "ブログ",
                  item: `${appUrl}/blog`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: post.title,
                  item: `${appUrl}/blog/${post.slug}`,
                },
              ],
            },
          ]),
        }}
      />
    </div>
  );
}
