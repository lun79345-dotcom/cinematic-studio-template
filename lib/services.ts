import { getHomeContent } from "@/lib/home-content";

export async function getServices() {
  return (await getHomeContent()).services;
}

export async function getServiceBySlug(slug: string) {
  return (await getServices()).find((service) => service.slug === slug);
}
