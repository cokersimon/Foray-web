import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /r/* are unlisted share links (ADR-022) — never index tokens.
        disallow: ["/admin", "/sign-in", "/auth", "/api", "/r"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
