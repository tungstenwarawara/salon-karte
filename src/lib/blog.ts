/** ブログ記事の読み込みユーティリティ */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

/** 日本語の読了時間を推定（400文字/分） */
function estimateReadingTime(text: string): number {
  const charCount = text.replace(/\s/g, "").length;
  return Math.max(1, Math.ceil(charCount / 400));
}

/** Markdown のカスタム記法をHTMLに変換 */
function transformCallouts(htmlContent: string): string {
  // :::tip / :::warning / :::point 記法
  return htmlContent.replace(
    /:::(tip|warning|point)\s*\n([\s\S]*?):::/g,
    (_, type, content) => {
      const icons: Record<string, string> = {
        tip: "&#x1f4a1;",
        warning: "&#x26a0;&#xfe0f;",
        point: "&#x2714;&#xfe0f;",
      };
      const titles: Record<string, string> = {
        tip: "ポイント",
        warning: "注意",
        point: "チェック",
      };
      return `<div class="callout callout-${type}"><div class="callout-title">${icons[type]} ${titles[type]}</div><div>${content.trim()}</div></div>`;
    }
  );
}

/** 見出しIDの抽出（目次用） */
function extractHeadings(
  htmlContent: string
): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const regex = /<h([23])[^>]*>(.*?)<\/h\1>/g;
  let match;
  while ((match = regex.exec(htmlContent)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, "");
    const id = text
      .toLowerCase()
      .replace(/[^\w\u3000-\u9fff\uff00-\uffef]+/g, "-")
      .replace(/^-|-$/g, "");
    headings.push({ id, text, level: parseInt(match[1]) });
  }
  return headings;
}

/** h2/h3 に id 属性を付与 */
function addHeadingIds(htmlContent: string): string {
  return htmlContent.replace(
    /<h([23])([^>]*)>(.*?)<\/h\1>/g,
    (_, level, attrs, text) => {
      const plainText = text.replace(/<[^>]*>/g, "");
      const id = plainText
        .toLowerCase()
        .replace(/[^\w\u3000-\u9fff\uff00-\uffef]+/g, "-")
        .replace(/^-|-$/g, "");
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    }
  );
}

export type BlogCategory = "salon-management" | "tax-accounting" | "marketing";

export const BLOG_CATEGORIES: Record<
  BlogCategory,
  { label: string; color: string }
> = {
  "salon-management": { label: "サロン経営", color: "bg-accent/10 text-accent" },
  "tax-accounting": {
    label: "確定申告・会計",
    color: "bg-success/10 text-success",
  },
  marketing: {
    label: "集客・マーケティング",
    color: "bg-warning/10 text-warning",
  },
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  category: BlogCategory;
  emoji: string;
  readingTime: number;
  content: string;
  headings: { id: string; text: string; level: number }[];
};

export type BlogPostMeta = Omit<BlogPost, "content" | "headings">;

/** 全記事のメタ情報を取得（公開日降順） */
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      slug: data.slug || file.replace(/\.md$/, ""),
      title: data.title || "無題",
      description: data.description || "",
      publishedAt: data.publishedAt || "",
      tags: data.tags || [],
      category: (data.category || "salon-management") as BlogCategory,
      emoji: data.emoji || "📝",
      readingTime: estimateReadingTime(content),
    };
  });

  return posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** slug から記事を1件取得 */
export async function getPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  if (!fs.existsSync(BLOG_DIR)) return null;

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const postSlug = data.slug || file.replace(/\.md$/, "");

    if (postSlug === slug) {
      const result = await remark().use(html).process(content);
      let htmlContent = result.toString();
      htmlContent = transformCallouts(htmlContent);
      htmlContent = addHeadingIds(htmlContent);
      const headings = extractHeadings(htmlContent);

      return {
        slug: postSlug,
        title: data.title || "無題",
        description: data.description || "",
        publishedAt: data.publishedAt || "",
        tags: data.tags || [],
        category: (data.category || "salon-management") as BlogCategory,
        emoji: data.emoji || "📝",
        readingTime: estimateReadingTime(content),
        content: htmlContent,
        headings,
      };
    }
  }

  return null;
}
