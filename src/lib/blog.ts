/** ブログ記事の読み込みユーティリティ */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  content: string; // HTML
};

export type BlogPostMeta = Omit<BlogPost, "content">;

/** 全記事のメタ情報を取得（公開日降順） */
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data } = matter(raw);
    return {
      slug: data.slug || file.replace(/\.md$/, ""),
      title: data.title || "無題",
      description: data.description || "",
      publishedAt: data.publishedAt || "",
      tags: data.tags || [],
    };
  });

  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** slug から記事を1件取得 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!fs.existsSync(BLOG_DIR)) return null;

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const postSlug = data.slug || file.replace(/\.md$/, "");

    if (postSlug === slug) {
      const result = await remark().use(html).process(content);
      return {
        slug: postSlug,
        title: data.title || "無題",
        description: data.description || "",
        publishedAt: data.publishedAt || "",
        tags: data.tags || [],
        content: result.toString(),
      };
    }
  }

  return null;
}
