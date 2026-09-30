"use client";

import { Navbar } from "@/components/layout/Navbar";
import type { ServiceNavigationItem } from "@/types/home-content";

// 案例详情沿用全站导航，统一桌面/移动菜单、主题与中英文偏好。
export function CaseNavbar({ services }: { services: ServiceNavigationItem[] }) {
  return <Navbar services={services} />;
}
