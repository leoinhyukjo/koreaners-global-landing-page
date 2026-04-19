import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: "https://www.koreaners.co/sitemap.xml",
  };
}

// NOTE: public/robots.txt takes precedence over this file.
// AI crawler allowlist + training-crawler block lives in public/robots.txt.
// This file kept as fallback; actual served content = public/robots.txt.
// llms.txt는 /llms.txt route로 별도 제공
