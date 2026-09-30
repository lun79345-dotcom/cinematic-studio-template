import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { HeroVideoManager } from "@/components/admin/HeroVideoManager";
import { ADMIN_COOKIE, isValidSession } from "@/lib/admin-auth";
import { getHeroVideos } from "@/lib/hero-video-store";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  if (!isValidSession((await cookies()).get(ADMIN_COOKIE)?.value)) redirect("/admin/login");
  const videos = await getHeroVideos();

  return (
    <main className="min-h-[100dvh] bg-ink text-bone">
      <AdminHeader />
      <HeroVideoManager initialVideos={videos} />
    </main>
  );
}
