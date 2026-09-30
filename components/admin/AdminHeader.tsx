"use client";

import { withBasePath } from "@/lib/base-path";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Moon, Sun, Type } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAdminTheme } from "@/components/admin/AdminThemeProvider";

const fontSizes = [
  { value: "sm", label: "小" },
  { value: "md", label: "中" },
  { value: "lg", label: "大" },
  { value: "xl", label: "特大" },
] as const;

const navigation = [
  { href: "/admin/cases", label: "案例管理" },
  { href: "/admin/services", label: "服务管理" },
  { href: "/admin/brands", label: "合作品牌" },
  { href: "/admin/contact", label: "联系资料" },
  { href: "/admin/files", label: "公共文件" },
  { href: "/admin/videos", label: "背景视频" },
];

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, fontSize, toggleTheme, setFontSize } = useAdminTheme();

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch(withBasePath("/api/admin/logout"), { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/10 bg-ink/95 px-4 backdrop-blur-lg sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-16 max-w-[1500px] flex-wrap items-center gap-x-2 gap-y-1 py-2 sm:flex-nowrap sm:gap-4 sm:py-0">
        <Link href="/admin/cases" aria-label="Studio Template内容后台" className="shrink-0">
          <BrandLogo className="w-[116px] sm:w-[126px]" />
        </Link>
        <span className="hidden border-l border-gold/25 pl-4 text-xs text-bone/55 sm:block">内容后台</span>

        <nav aria-label="后台内容管理" className="order-last w-full min-w-0 overflow-x-auto sm:order-none sm:ml-auto sm:w-auto">
          <div className="flex w-max items-center gap-1">
            {navigation.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-control px-3 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${active ? "bg-gold/12 text-gold" : "text-bone/60 hover:bg-line/[0.04] hover:text-bone"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 sm:gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "切换浅色主题" : "切换暗色主题"}
            title={theme === "dark" ? "切换浅色主题" : "切换暗色主题"}
            className="grid size-11 place-items-center rounded-control text-bone/55 transition-colors hover:bg-line/[0.04] hover:text-gold"
          >
            {theme === "dark" ? <Sun className="size-4" strokeWidth={1.5} aria-hidden="true" /> : <Moon className="size-4" strokeWidth={1.5} aria-hidden="true" />}
          </button>

          <div className="flex items-center rounded-control border border-line/10 bg-line/[0.03]" role="group" aria-label="字体大小">
            <Type className="ml-2 hidden size-3.5 text-bone/45 sm:block" strokeWidth={1.5} aria-hidden="true" />
            {fontSizes.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFontSize(option.value)}
                aria-pressed={fontSize === option.value}
                className={`grid min-h-11 min-w-7 place-items-center px-1 text-xs transition-colors sm:min-w-9 sm:px-1.5 ${fontSize === option.value ? "text-gold" : "text-bone/55 hover:text-bone"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          disabled={loggingOut}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control px-2 text-xs text-bone/55 transition-colors hover:bg-line/[0.04] hover:text-bone disabled:cursor-wait disabled:opacity-50 sm:px-3 sm:text-sm"
        >
          <LogOut className="size-4" strokeWidth={1.5} aria-hidden="true" />
          <span className="hidden sm:inline">{loggingOut ? "退出中" : "退出"}</span>
        </button>
      </div>
    </header>
  );
}
