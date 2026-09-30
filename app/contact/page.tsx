import type { Metadata } from "next";
import { ContactLeadPage } from "@/components/contact/ContactLeadPage";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { getHomeContent } from "@/lib/home-content";
import { getSiteSettings } from "@/lib/site-settings";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "项目咨询",
  description: "告诉Studio Template你的项目目标，我们将与你一起梳理创意方向、制作方式与交付计划。",
  alternates: { canonical: absoluteSiteUrl("/contact") },
};

export default async function ContactPage() {
  const [homeContent, siteSettings] = await Promise.all([getHomeContent(), getSiteSettings()]);
  const navigationServices = homeContent.services.map(({ slug, name, description, features, showInNavigation }) => ({ slug, name, description, features, showInNavigation }));

  return (
    <div className="bg-ink text-bone">
      <Navbar services={navigationServices} />
      <ContactLeadPage />
      <Footer settings={siteSettings.contact} services={navigationServices} />
    </div>
  );
}
