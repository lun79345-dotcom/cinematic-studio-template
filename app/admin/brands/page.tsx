import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { BrandManager } from "@/components/admin/BrandManager";
import { ADMIN_COOKIE, isValidSession } from "@/lib/admin-auth";
import { getHomeContent } from "@/lib/home-content";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  if (!isValidSession((await cookies()).get(ADMIN_COOKIE)?.value)) redirect("/admin/login");
  const content = await getHomeContent();

  return (
    <main className="min-h-[100dvh] bg-ink text-bone">
      <AdminHeader />
      <BrandManager initialBrands={content.brands} />
    </main>
  );
}
