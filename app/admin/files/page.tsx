import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PublicFileManager } from "@/components/admin/PublicFileManager";
import { ADMIN_COOKIE, isValidSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminFilesPage() {
  if (!isValidSession((await cookies()).get(ADMIN_COOKIE)?.value)) redirect("/admin/login");

  return (
    <main className="min-h-[100dvh] bg-ink text-bone">
      <AdminHeader />
      <PublicFileManager />
    </main>
  );
}
