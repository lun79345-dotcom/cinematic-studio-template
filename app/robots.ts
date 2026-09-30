import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/lib/base-path";
import { absoluteSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const publicRoot = `${BASE_PATH || ""}/`;

  return {
    rules: {
      userAgent: "*",
      allow: publicRoot,
      disallow: [
        `${BASE_PATH}/admin/`,
        `${BASE_PATH}/api/`,
      ],
    },
    sitemap: absoluteSiteUrl("/sitemap.xml"),
  };
}
