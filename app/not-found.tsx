import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotFoundContent } from "@/components/layout/NotFoundContent";
import { getServices } from "@/lib/services";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: { absolute: "页面未找到 | Studio Template" },
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const [services, settings] = await Promise.all([getServices(), getSiteSettings()]);
  return (
    <main className="min-h-screen bg-ink text-bone">
      <Navbar services={services} />
      <NotFoundContent />
      <Footer services={services} settings={settings.contact} />
    </main>
  );
}
