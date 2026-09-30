import type { Metadata } from "next";
import { NewsPage } from "@/components/news/NewsPage";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getHomeContent } from "@/lib/home-content";
import { getSiteSettings } from "@/lib/site-settings";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "新闻动态",
  description: "Studio Template的团队动态、项目进展与影像创作分享。",
  alternates: { canonical: absoluteSiteUrl("/news") },
};

export default async function News({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const [homeContent, siteSettings] = await Promise.all([getHomeContent(), getSiteSettings()]);
  const services = homeContent.services.map(({ slug, name, description, features, showInNavigation }) => ({ slug, name, description, features, showInNavigation }));

  return (
    <div className="bg-ink text-bone">
      <Navbar services={services} />
      <NewsPage requestedPage={typeof (await searchParams).page === "string" ? Number((await searchParams).page) : 1} />
      <Footer settings={siteSettings.contact} services={services} />
    </div>
  );
}
