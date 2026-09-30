"use client";

import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default function AuroraBackgroundDemo() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
        className="relative flex flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <div className="text-3xl font-bold text-bone md:text-7xl">
          Background lights are cool you know.
        </div>
        <div className="py-4 text-base font-extralight text-mist md:text-4xl">
          And this, is chemical burn.
        </div>
        <button className="w-fit rounded-full bg-bone px-4 py-2 text-ink">
          Debug now
        </button>
      </motion.div>
    </AuroraBackground>
  );
}
