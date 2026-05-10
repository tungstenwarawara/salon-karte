import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://salonkarte.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/tokusho`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // 公開済みサロンHP (/s/{slug}) を動的にサイトマップへ追加
  let salonPages: MetadataRoute.Sitemap = [];
  try {
    const admin = createAdminClient();
    const { data: salons } = await admin
      .from("salons")
      .select("booking_slug, updated_at")
      .eq("hp_enabled", true)
      .not("booking_slug", "is", null);
    if (salons) {
      salonPages = salons
        .filter((s) => !!s.booking_slug)
        .map((s) => ({
          url: `${baseUrl}/s/${s.booking_slug}`,
          lastModified: new Date(s.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.85,
        }));
    }
  } catch {
    // ビルド時にDB接続できなくてもサイトマップ生成を止めない
  }

  return [...staticPages, ...blogPosts, ...salonPages];
}
