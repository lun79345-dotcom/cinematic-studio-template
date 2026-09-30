import { FeaturedWork } from "@/components/home/FeaturedWork";
import { DirectorTeam } from "@/components/home/DirectorTeam";
import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { Trust } from "@/components/home/Trust";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getCases } from "@/lib/cases";
import { getHeroVideos } from "@/lib/hero-video-store";
import { getHomeContent } from "@/lib/home-content";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

// 首页保持为服务端组件，只有需要动效的子模块切换到客户端渲染。
export default async function Home() {
  const [cases, heroVideos, homeContent, siteSettings] = await Promise.all([
    getCases(),
    getHeroVideos(),
    getHomeContent(),
    getSiteSettings(),
  ]);
  const homeCaseSlugs = new Set(homeContent.homeCaseSlugs);
  const homeCases = cases.filter((item) => homeCaseSlugs.has(item.slug));
  const navigationServices = homeContent.services.map(({ slug, name, description, features, showInNavigation }) => ({ slug, name, description, features, showInNavigation }));

  return (
    <main className="overflow-clip bg-ink text-bone">
      <Navbar services={navigationServices} />
      <Hero
        videos={heroVideos.filter((video) => video.enabled)}
        primaryAnchor={homeContent.services.some((service) => service.showOnHome) ? "services" : "cases"}
      />
      <Trust brands={homeContent.brands} />
      <Services services={homeContent.services} />
      <FeaturedWork cases={homeCases} />
      <DirectorTeam />
      <Footer settings={siteSettings.contact} services={navigationServices} />
    </main>
  );
}
