import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { BrandLogo } from "@/components/ui/brand-logo";

export const metadata: Metadata = {
  title: "ブログ | Salon Karte",
  description: "個人サロンの経営・カルテ管理・確定申告に役立つ情報をお届けします。",
};

export default function BlogListPage() {
  const posts = getAllPosts();

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
        <h1 className="text-3xl font-bold mb-2">ブログ</h1>
        <p className="text-text-light mb-10">
          個人サロン経営に役立つ情報をお届けします
        </p>

        {posts.length === 0 ? (
          <p className="text-text-light text-center py-16">記事の準備中です</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block bg-surface border border-border rounded-2xl p-6 hover:border-accent/30 transition-colors"
                >
                  <time className="text-sm text-text-light">
                    {new Date(post.publishedAt).toLocaleDateString("ja-JP")}
                  </time>
                  <h2 className="text-lg font-bold mt-1 mb-2">{post.title}</h2>
                  <p className="text-sm text-text-light leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-background text-text-light rounded-lg px-2 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* シンプルなフッター */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-text-light">
        <Link href="/" className="hover:text-accent transition-colors">
          Salon Karte トップ
        </Link>
        <span className="mx-2">|</span>
        <Link href="/privacy" className="hover:text-accent transition-colors">
          プライバシーポリシー
        </Link>
      </footer>
    </div>
  );
}
