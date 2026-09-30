"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import { withBasePath } from "@/lib/base-path";

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

export function CaseAutoplayVideo({
  src,
  poster,
  alt,
}: {
  src: string;
  poster: string;
  alt: string;
}) {
  const reduced = useReducedMotion();
  const [videoAllowed, setVideoAllowed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData;
    setVideoAllowed(reduced === false && !saveData);
  }, [reduced]);

  return (
    <>
      <Image
        src={withBasePath(poster)}
        alt={alt}
        fill
        priority
        sizes="(max-width: 1100px) 100vw, 1040px"
        className={`object-cover transition-opacity duration-500 ${videoReady ? "opacity-0" : "opacity-100"}`}
      />
      {videoAllowed ? (
        <video
          src={withBasePath(src)}
          poster={withBasePath(poster)}
          autoPlay
          controls
          loop
          muted
          playsInline
          preload="metadata"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${videoReady ? "opacity-100" : "opacity-0"}`}
        >
          当前浏览器不支持视频播放 / Your browser does not support video.
        </video>
      ) : null}
    </>
  );
}
