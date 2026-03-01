import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/login/", "/signup/", "/setup/"],
    },
    sitemap: "https://salonkarte.com/sitemap.xml",
  };
}
