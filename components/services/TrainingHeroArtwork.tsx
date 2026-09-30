"use client";

import { useEffect, useId, useState } from "react";

type TrainingHeroArtworkProps = {
  reduceMotion: boolean | null;
};

const nodes = [[270, 848], [710, 884], [1010, 430]] as const;
const heroCutPath = "M0 0 H980 L720 1000 H0 Z";

function Blueprint({ reduceMotion }: TrainingHeroArtworkProps) {
  return (
    <g fill="none" stroke="rgb(var(--training-blue))" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M150 900 C360 790 470 990 710 884 C920 792 936 560 1088 286"
        strokeWidth="1.35"
        strokeDasharray="4 10"
        opacity="0.14"
        className={reduceMotion ? undefined : "training-blueprint-flow"}
      />

      {nodes.map(([x, y], index) => (
        <g key={`${x}-${y}`}>
          <circle
            cx={x}
            cy={y}
            r="6"
            fill="rgb(var(--training-blue))"
            stroke="none"
            opacity="0.18"
            className={reduceMotion ? undefined : "training-blueprint-node"}
            style={reduceMotion ? undefined : { animationDelay: `${index * 0.55}s` }}
          />
          <circle cx={x} cy={y} r="15" strokeWidth="1" opacity="0.1" />
        </g>
      ))}

      <g opacity="0.11" strokeWidth="1.4">
        <circle cx="360" cy="820" r="78" />
        <circle cx="360" cy="820" r="56" />
        <path d="M264 820 H288 M432 820 H456 M360 724 V748 M360 892 V916" />
        <path d="M340 812 C340 792 380 792 380 812 C380 826 372 830 370 842 H350 C348 830 340 826 340 812 Z M352 852 H368" />

        <circle cx="870" cy="790" r="82" />
        <circle cx="870" cy="790" r="60" />
        <rect x="826" y="758" width="88" height="64" rx="7" />
        <path d="M838 808 L858 784 L874 798 L902 770" />

        <circle cx="1026" cy="344" r="70" />
        <circle cx="1026" cy="344" r="50" />
        <path d="M995 352 C995 330 1010 318 1027 321 C1038 302 1071 313 1068 337 C1088 344 1080 370 1061 370 H1008 C988 370 980 348 995 352 Z" />
        <path d="M1026 374 V340 M1016 350 L1026 340 L1036 350" />
      </g>
    </g>
  );
}

export function TrainingHeroArtwork({ reduceMotion }: TrainingHeroArtworkProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const instanceId = useId().replace(/:/g, "");
  const clipId = `training-left-${instanceId}`;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncViewport = () => setIsDesktop(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  if (!isDesktop) return null;

  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="none" className="block size-full overflow-visible" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d={heroCutPath} />
        </clipPath>
      </defs>

      <path d={heroCutPath} className="fill-[rgb(var(--training-canvas))]" />
      <g clipPath={`url(#${clipId})`}>
        <Blueprint reduceMotion={reduceMotion} />
      </g>
    </svg>
  );
}
