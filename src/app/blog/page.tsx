import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, BLOG_CATEGORIES } from "@/lib/blog";
import { BlogHeader } from "@/components/blog/blog-header";
import { LpFooter } from "@/components/lp/lp-footer";

export const metadata: Metadata = {
  title: "ブログ | Salon Karte — 個人サロン経営の知恵袋",
  description:
    "個人サロンの経営・カルテ管理・確定申告に役立つ情報をお届けします。現場で使えるノウハウを分かりやすく解説。",
  openGraph: {
    title: "ブログ | Salon Karte",
    description:
      "個人サロンの経営・カルテ管理・確定申告に役立つ情報をお届けします。",
    type: "website",
  },
};

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BlogHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* ヒーロー */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            個人サロン経営の知恵袋
          </h1>
          <p className="text-text-light text-lg max-w-lg mx-auto leading-relaxed">
            カルテ管理・確定申告・集客のコツなど、
            <br className="hidden sm:block" />
            現場で使えるノウハウをお届けします
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-text-light text-center py-16">
            記事の準備中です
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => {
              const cat = BLOG_CATEGORIES[post.category];
              return (
                <article key={post.slug} className="group">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex flex-col h-full bg-surface border border-border rounded-2xl p-6 hover:border-accent/40 hover:shadow-[var(--shadow-card-hover)] transition-all duration-200"
                  >
                    {/* アイキャッチ絵文字 + カテゴリ */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-4xl leading-none">{post.emoji}</span>
                      <span
                        className={`text-xs font-medium rounded-lg px-2.5 py-1 ${cat.color}`}
                      >
                        {cat.label}
                      </span>
                    </div>

                    {/* タイトル */}
                    <h2 className="text-lg font-bold leading-snug mb-2 group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>

                    {/* 説明 */}
                    <p className="text-sm text-text-light leading-relaxed line-clamp-2 mb-4 flex-1">
                      {post.description}
                    </p>

                    {/* メタ情報 */}
                    <div className="flex items-center gap-3 text-xs text-text-light pt-3 border-t border-border/50">
                      <time>
                        {new Date(post.publishedAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>{post.readingTime}分で読める</span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {/* ブログ下部CTA */}
        <div className="mt-16 bg-gradient-to-br from-[#F5F1ED] to-background border border-border rounded-2xl p-8 md:p-10 text-center">
          <p className="text-2xl font-bold mb-2">
            カルテ管理をもっとラクに
          </p>
          <p className="text-text-light mb-6 max-w-md mx-auto">
            Salon Karte は個人サロン専用の管理アプリ。
            カルテ・予約・売上・確定申告までこれひとつ。
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
      </main>

      <LpFooter />
    </div>
  );
}
