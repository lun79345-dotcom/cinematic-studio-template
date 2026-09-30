"use client";

import React from "react";
import { Boxes } from "@/components/ui/background-boxes";
import { cn } from "@/lib/utils";

export default function BackgroundBoxesDemo() {
  return (
    <div className="relative flex h-96 w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-slate-900">
      <div className="absolute inset-0 z-20 size-full bg-slate-900 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      <div className="absolute inset-0">
        <Boxes />
      </div>
      <h1 className={cn("relative z-20 text-xl text-white md:text-4xl")}>Tailwind is Awesome</h1>
      <p className="relative z-20 mt-2 text-center text-neutral-300">
        Framer Motion is the best animation library ngl
      </p>
    </div>
  );
}
