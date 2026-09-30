import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CaseManager } from "@/components/admin/CaseManager";
import { ADMIN_COOKIE, isValidSession } from "@/lib/admin-auth";
import { getCases } from "@/lib/cases";
import { getHomeContent } from "@/lib/home-content";

export const dynamic = "force-dynamic";

export default async function AdminCasesPage() {
  if (!isValidSession((await cookies()).get(ADMIN_COOKIE)?.value)) redirect("/admin/login");
  const [cases, homeContent] = await Promise.all([
    getCases({ includeDrafts: true }),
    getHomeContent(),
  ]);
  return (
    <CaseManager
      initialCases={cases}
      initialHomeCaseSlugs={homeContent.homeCaseSlugs}
    />
  );
}
