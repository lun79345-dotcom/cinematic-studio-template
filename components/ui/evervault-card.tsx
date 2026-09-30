import { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type EvervaultCardProps = ComponentPropsWithoutRef<"div">;

// 保留 Evervault 卡片的四角标记与信息场感，去除鼠标跟随和随机字符动效。
export function EvervaultCard({ className, children, ...props }: EvervaultCardProps) {
  return (
    <div
      className={cn("relative isolate h-full min-w-0 border border-gold/25 bg-panel/55", className)}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-stage-grid bg-[length:32px_32px] opacity-20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/55 to-transparent" />
        <div className="absolute right-0 top-0 size-48 translate-x-1/3 -translate-y-1/3 rounded-full bg-gold/[0.035] blur-3xl" />
      </div>

      <CornerMark className="absolute -left-3 -top-3 z-20 size-6 text-gold/75" />
      <CornerMark className="absolute -bottom-3 -left-3 z-20 size-6 text-gold/75" />
      <CornerMark className="absolute -right-3 -top-3 z-20 size-6 text-gold/75" />
      <CornerMark className="absolute -bottom-3 -right-3 z-20 size-6 text-gold/75" />

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

function CornerMark({ className, ...props }: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.25}
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
    </svg>
  );
}
