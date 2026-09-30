import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { ADMIN_COOKIE, isValidSession } from "@/lib/admin-auth";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default async function AdminLoginPage() {
  if (isValidSession((await cookies()).get(ADMIN_COOKIE)?.value)) redirect("/admin/cases");

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-ink px-5 text-bone">
      <section className="w-full max-w-md rounded-card border border-line/12 bg-panel p-7 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-10">
        <BrandLogo className="w-[220px] max-w-full" priority />
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-gold">CONTENT MANAGEMENT</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">网站内容管理</h1>
        <p className="mt-3 text-sm leading-6 text-mist">管理首页合作品牌、核心服务与案例内容。</p>
        <LoginForm />
      </section>
    </main>
  );
}
