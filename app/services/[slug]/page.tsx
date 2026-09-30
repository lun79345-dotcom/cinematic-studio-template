import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/services/ServiceDetail";
import { AigcTrainingLanding } from "@/components/services/AigcTrainingLanding";
import { getServiceBySlug, getServices } from "@/lib/services";
import { getSiteSettings } from "@/lib/site-settings";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const service = await getServiceBySlug((await params).slug);

  if (!service) {
    return {
      title: { absolute: "页面未找到 | Studio Template" },
      robots: { index: false, follow: false },
    };
  }

  const title = service.name.zh;
  const description = service.seoDescription?.zh || service.description.zh;
  const previewImage = service.media.type === "image" ? service.media.src : service.media.poster;

  return {
    title,
    description,
    alternates: { canonical: absoluteSiteUrl(`/services/${service.slug}`) },
    openGraph: {
      title,
      description,
      type: "website",
      url: absoluteSiteUrl(`/services/${service.slug}`),
      ...(previewImage ? { images: [absoluteSiteUrl(previewImage)] } : {}),
    },
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const [services, settings] = await Promise.all([getServices(), getSiteSettings()]);
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();

  const navigationServices = services.map(({ slug, name, description, features, showInNavigation }) => ({ slug, name, description, features, showInNavigation }));

  if (service.slug === "creative-training") {
    return <AigcTrainingLanding services={navigationServices} contact={settings.contact} />;
  }

  return <ServiceDetail service={service} services={navigationServices} contact={settings.contact} />;
}
