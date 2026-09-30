import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsArticle } from "@/components/news/NewsArticle";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getHomeContent } from "@/lib/home-content";
import { getSiteSettings } from "@/lib/site-settings";
import { getNewsArticle } from "@/lib/news-articles";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = getNewsArticle((await params).slug);
  if (!article) return {};
  const description = article.blocks.find((block) => block.type === "paragraph" && block.text.zh.length > 40);
  const summary = description && description.type !== "image" ? description.text.zh.slice(0, 160) : article.title.zh;
  const image = article.blocks.find((block) => block.type === "image");
  const url = absoluteSiteUrl(`/news/${article.id}`);
  return {
    title: article.title.zh,
    description: summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article", title: article.title.zh, description: summary, url, publishedTime: article.publishedAt,
      images: image?.type === "image" ? [{ url: absoluteSiteUrl(image.src), width: image.width, height: image.height, alt: image.alt.zh }] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getNewsArticle((await params).slug);
  if (!article) notFound();
  const [homeContent, siteSettings] = await Promise.all([getHomeContent(), getSiteSettings()]);
  const services = homeContent.services.map(({ slug, name, description, features, showInNavigation }) => ({ slug, name, description, features, showInNavigation }));
  return (
    <div className="bg-ink text-bone">
      <Navbar services={services} />
      <NewsArticle article={article} />
      <Footer settings={siteSettings.contact} services={services} />
    </div>
  );
}
