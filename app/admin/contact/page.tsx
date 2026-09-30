import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ContactSettingsManager } from "@/components/admin/ContactSettingsManager";
import { ADMIN_COOKIE, isValidSession } from "@/lib/admin-auth";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  if (!isValidSession((await cookies()).get(ADMIN_COOKIE)?.value)) redirect("/admin/login");
  const settings = await getSiteSettings();

  return (
    <main className="min-h-[100dvh] bg-ink text-bone">
      <AdminHeader />
      <ContactSettingsManager initialSettings={settings} />
    </main>
  );
}
