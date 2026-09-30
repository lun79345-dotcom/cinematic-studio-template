import { ComponentPropsWithoutRef } from "react";

// 统一大留白节奏，移动端自动缩短但不牺牲层次。
export function Section({ className = "", ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={`relative py-24 sm:py-32 lg:py-40 min-[1920px]:py-48 ${className}`} {...props} />;
}
