"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

// 服务端内容默认可见，不能依赖客户端动画才能阅读。
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.75, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
