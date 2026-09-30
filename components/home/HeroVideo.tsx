"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { HeroVideo as HeroVideoItem } from "@/types/hero-video";
import { withBasePath } from "@/lib/base-path";

const defaultPoster = "/images/demo-scene.svg";

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

export function HeroVideo({ videos }: { videos: HeroVideoItem[] }) {
  const reduced = useReducedMotion();
  const selectedVideos = useMemo(
    () => videos.filter((video) => video.enabled),
    [videos],
  );
  const [source, setSource] = useState<HeroVideoItem | null>(null);
  const [ready, setReady] = useState(false);
  const queue = useRef<HeroVideoItem[]>([]);
  const consecutiveErrors = useRef(0);

  const takeNext = useCallback(() => {
    if (!selectedVideos.length) return null;
    if (!queue.current.length) {
      queue.current = [...selectedVideos];
    }
    const next = queue.current.shift() ?? null;
    return next;
  }, [selectedVideos]);

  useEffect(() => {
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData;
    queue.current = [];
    consecutiveErrors.current = 0;
    if (!selectedVideos.length || reduced || saveData) {
      setReady(false);
      setSource(null);
      return;
    }
    setSource(takeNext());
  }, [reduced, selectedVideos, takeNext]);

  function advance() {
    setReady(false);
    consecutiveErrors.current = 0;
    setSource(takeNext());
  }

  function recoverFromError() {
    setReady(false);
    consecutiveErrors.current += 1;
    if (consecutiveErrors.current >= selectedVideos.length) {
      setSource(null);
      return;
    }
    setSource(takeNext());
  }

  return (
    <div className="absolute inset-0 bg-ink" aria-hidden="true">
      <picture>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={withBasePath("/images/demo-scene.svg")} alt="" width={1672} height={941} fetchPriority="high" loading="eager" className={`absolute inset-0 size-full object-cover object-[63%_center] transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`} />
      </picture>
      {source ? (
        <video
          key={source.id}
          src={withBasePath(source.src)}
          poster={withBasePath(defaultPoster)}
          autoPlay
          muted
          playsInline
          loop={selectedVideos.length === 1}
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          onCanPlay={() => { consecutiveErrors.current = 0; setReady(true); }}
          onEnded={selectedVideos.length > 1 ? advance : undefined}
          onError={recoverFromError}
          className={`absolute inset-0 size-full object-cover object-center transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      ) : null}
      <div className="hero-scrim-x absolute inset-0" />
      <div className="hero-scrim-y absolute inset-0" />
      <div className="hero-glow absolute inset-0" />
    </div>
  );
}
