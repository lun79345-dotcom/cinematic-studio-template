import type { MetadataRoute } from "next";
import { getCases } from "@/lib/cases";
import { getServices } from "@/lib/services";
import { absoluteSiteUrl } from "@/lib/site-url";
import { newsItems } from "@/lib/news";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cases, services] = await Promise.all([getCases(), getServices()]);
  const publishedCases = cases.filter((item) => item.published);
  const contentDates = [
    ...publishedCases.map((item) => item.updatedAt),
    ...services.map((service) => service.updatedAt),
  ].map((value) => new Date(value));
  const latestContentDate = contentDates.length
    ? new Date(Math.max(...contentDates.map((date) => date.getTime())))
    : new Date();

  return [
    ...newsItems.map((item) => ({
      url: absoluteSiteUrl(`/news/${item.id}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: absoluteSiteUrl("/news"),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: absoluteSiteUrl("/"),
      lastModified: latestContentDate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteSiteUrl("/contact"),
      lastModified: latestContentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...services.map((service) => ({
      url: absoluteSiteUrl(`/services/${service.slug}`),
      lastModified: new Date(service.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...publishedCases.map((item) => ({
      url: absoluteSiteUrl(`/cases/${item.slug}`),
      lastModified: new Date(item.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
