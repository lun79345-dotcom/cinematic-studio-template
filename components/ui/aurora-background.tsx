"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: ReactNode;
  showRadialGradient?: boolean;
  variant?: "content" | "layer";
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  variant = "content",
  style,
  ...props
}: AuroraBackgroundProps) => {
  const isLayer = variant === "layer";

  return (
    <div
      className={cn(
        isLayer
          ? "pointer-events-none absolute inset-0 overflow-hidden"
          : "relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-carbon text-bone",
        className,
      )}
      style={
        {
          "--aurora-primary": "222 189 135",
          "--aurora-highlight": "241 216 164",
          "--aurora-deep": "168 111 24",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className={cn("aurora-gold-field", showRadialGradient && "aurora-gold-mask")} />
        <div className="aurora-gold-vignette absolute inset-0" />
      </div>
      {children ? <div className="relative z-10 w-full">{children}</div> : null}
    </div>
  );
};
