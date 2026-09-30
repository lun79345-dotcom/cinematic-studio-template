import type { Metadata } from "next";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";

export const metadata: Metadata = {
  title: "内容管理",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminThemeProvider>{children}</AdminThemeProvider>;
}
