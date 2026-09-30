"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CaseStudy } from "@/types/case";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { localizeCase } from "@/lib/i18n";
import { withBasePath } from "@/lib/base-path";

const AUTOPLAY_INTERVAL_MS = 4000;
const HOME_VIDEO_PREVIEW_SECONDS = 8;
const FIRST_FRAME_SEEK_SECONDS = 0.01;

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

function useCasesPerRow() {
  const [casesPerRow, setCasesPerRow] = useState(3);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const tablet = window.matchMedia("(min-width: 640px)");
    const update = () => setCasesPerRow(desktop.matches ? 3 : tablet.matches ? 2 : 1);

    update();
    desktop.addEventListener("change", update);
    tablet.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      tablet.removeEventListener("change", update);
    };
  }, []);

  return casesPerRow;
}

function CaseHomeMedia({
  item,
  sizes,
  priority,
  previewActive,
}: {
  item: CaseStudy;
  sizes: string;
  priority: boolean;
  previewActive: boolean;
}) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoAllowed, setVideoAllowed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const media = item.homeMedia ?? { type: "image" as const, src: item.coverImage };
  const explicitPoster = media.type === "video" ? media.poster : undefined;
  const poster = explicitPoster || item.coverImage;

  useEffect(() => {
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData;
    setVideoAllowed(media.type === "video" && !reduced && !saveData);
  }, [media.type, reduced]);

  useEffect(() => {
    const video = videoRef.current;
    if (media.type === "video" && !explicitPoster) video?.load();
  }, [explicitPoster, media.type]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (videoAllowed && previewActive) {
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
    if (explicitPoster || video.readyState < HTMLMediaElement.HAVE_METADATA) {
      video.currentTime = 0;
    } else {
      video.currentTime = FIRST_FRAME_SEEK_SECONDS;
    }
  }, [explicitPoster, previewActive, videoAllowed]);

  if (media.type === "image") {
    return (
      <Image
        src={withBasePath(media.src)}
        alt={item.coverAlt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition duration-1000 ease-expo group-hover:scale-[1.045] group-focus-visible:scale-[1.045]"
      />
    );
  }

  const videoActive = videoReady && videoAllowed && previewActive;

  return (
    <>
      <Image
        src={withBasePath(poster)}
        alt={item.coverAlt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover transition duration-1000 ease-expo group-hover:scale-[1.045] group-focus-visible:scale-[1.045] ${videoActive ? "opacity-0" : "opacity-100"}`}
      />
      <video
        ref={videoRef}
        src={withBasePath(media.src)}
        poster={explicitPoster ? withBasePath(explicitPoster) : undefined}
        muted
        loop
        playsInline
        preload={explicitPoster ? "none" : "metadata"}
        tabIndex={-1}
        aria-hidden="true"
        onLoadedMetadata={(event) => {
          if (!explicitPoster && event.currentTarget.currentTime === 0) event.currentTarget.currentTime = FIRST_FRAME_SEEK_SECONDS;
        }}
        onLoadedData={() => setVideoReady(true)}
        onCanPlay={() => setVideoReady(true)}
        onError={() => setVideoReady(false)}
        onTimeUpdate={(event) => {
          if (event.currentTarget.currentTime >= HOME_VIDEO_PREVIEW_SECONDS) event.currentTarget.currentTime = 0;
        }}
        className={`absolute inset-0 size-full object-cover transition duration-1000 ease-expo group-hover:scale-[1.045] group-focus-visible:scale-[1.045] ${videoActive ? "opacity-100" : "opacity-0"}`}
      >
        当前浏览器不支持视频播放 / Your browser does not support video.
      </video>
    </>
  );
}

function CaseCard({
  item,
  sizes,
  priority,
  viewLabel,
  slideLabel,
}: {
  item: CaseStudy;
  sizes: string;
  priority: boolean;
  viewLabel: string;
  slideLabel: string;
}) {
  const [previewActive, setPreviewActive] = useState(false);
  const { copy } = usePreferences();

  return (
    <article aria-label={slideLabel} className="min-w-0">
      <Link
        href={`/cases/${item.slug}`}
        aria-label={item.title}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setPreviewActive(true);
        }}
        onPointerLeave={() => setPreviewActive(false)}
        onPointerCancel={() => setPreviewActive(false)}
        className="group relative block h-[13rem] overflow-hidden rounded-card bg-panel sm:h-[15rem] lg:h-[17rem] xl:h-[18rem] min-[1920px]:h-[20rem]"
      >
        <CaseHomeMedia item={item} sizes={sizes} priority={priority} previewActive={previewActive} />
        <div className="absolute inset-0 bg-gradient-to-t from-mediaScrim/95 via-mediaScrim/40 to-transparent" aria-hidden="true" />
        {item.isSample && <span className="absolute left-4 top-4 rounded-control border border-onMedia/30 bg-mediaScrim/80 px-2.5 py-1 text-xs text-onMedia">{copy.cases.conceptPiece}</span>}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-7">
          <p className="text-xs leading-5 text-onMedia/90">{item.category}{item.client && item.client !== "广告样片" ? ` · ${item.client}` : ""}</p>
          <h3 className="mt-2 text-lg font-medium leading-snug text-onMedia sm:text-xl">{item.title}</h3>
          <span className="mt-3 flex items-center justify-between gap-4 text-xs font-medium text-onMedia/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
            {viewLabel}
            <ArrowUpRight aria-hidden="true" className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5" strokeWidth={1.4} />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function FeaturedWork({ cases }: { cases: CaseStudy[] }) {
  const { copy, locale } = usePreferences();
  const reduced = useReducedMotion();
  const casesPerRow = useCasesPerRow();
  const casesPerPage = casesPerRow * 2;
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const localizedCases = cases.map((item) => localizeCase(item, locale));
  const totalPages = Math.max(1, Math.ceil(localizedCases.length / casesPerPage));
  const pageStart = currentPage * casesPerPage;
  const visibleCases = Array.from(
    { length: Math.min(casesPerPage, localizedCases.length) },
    (_, index) => localizedCases[(pageStart + index) % localizedCases.length],
  );
  const mediaSizes = casesPerRow === 3
    ? "(min-width: 1920px) 520px, (min-width: 1024px) 32vw, 100vw"
    : casesPerRow === 2
      ? "(min-width: 640px) 50vw, 100vw"
      : "100vw";

  useEffect(() => {
    setCurrentPage(0);
  }, [casesPerRow]);

  useEffect(() => {
    if (reduced || autoplayPaused || interactionPaused || totalPages <= 1) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setDirection(1);
      setCurrentPage((page) => (page + 1) % totalPages);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoplayPaused, interactionPaused, reduced, totalPages]);

  function changePage(step: number) {
    setDirection(step > 0 ? 1 : -1);
    setCurrentPage((page) => (page + step + totalPages) % totalPages);
  }

  const gridClass = casesPerRow === 3 ? "grid-cols-3" : casesPerRow === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <Section id="cases" className="isolate scroll-mt-[72px] overflow-hidden bg-carbon pb-24 pt-24 sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-[140px] min-[1920px]:pb-48 min-[1920px]:pt-48">
      <AuroraBackground variant="layer" className="z-0 opacity-70" aria-hidden="true" />
      <div className="relative z-[1] mx-auto w-full max-w-[1360px] min-[1920px]:max-w-[1640px]">
        <Container className="relative px-7 sm:px-10 lg:px-10">
          <div className="mx-auto max-w-[1280px] min-[1920px]:max-w-[1560px]">
            <Reveal className="mx-auto max-w-4xl text-center">
              <p className="marketing-meta inline-flex items-center gap-2 font-mono uppercase tracking-[0.2em] text-gold">
                <span className="h-px w-6 bg-gold" aria-hidden="true" />
                {copy.cases.eyebrow}
              </p>
              <h2 className={`mt-7 text-balance text-4xl leading-[1.18] sm:text-5xl lg:text-6xl min-[1920px]:text-[4.5rem] ${locale === "en" ? "font-sans font-[450] tracking-[-0.025em]" : "font-cn font-medium tracking-[0.01em]"}`}>
                <span className="whitespace-pre-line">{copy.cases.title}</span>
              </h2>
              <p className="marketing-copy mx-auto mt-6 max-w-[70ch] text-pretty text-mist">
                {copy.cases.description}
              </p>
            </Reveal>

            {!localizedCases.length ? (
              <div className="mt-14 rounded-card border border-gold/30 p-10 text-mist lg:mt-20">{copy.cases.empty}</div>
            ) : (
              <div
                className="mt-14 lg:mt-20"
                role="region"
                aria-roledescription="carousel"
                aria-label={copy.cases.carouselLabel}
                onMouseEnter={() => setInteractionPaused(true)}
                onMouseLeave={() => setInteractionPaused(false)}
                onFocusCapture={() => setInteractionPaused(true)}
                onBlurCapture={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false);
                }}
              >
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <motion.div
                    key={`${casesPerRow}-${currentPage}`}
                    custom={direction}
                    variants={{
                      enter: (value: number) => reduced
                        ? { opacity: 1 }
                        : { opacity: 0, x: value * 80, scale: 0.975, filter: "blur(10px) brightness(0.82)" },
                      center: { opacity: 1, x: 0, scale: 1, filter: "blur(0px) brightness(1)" },
                      exit: (value: number) => reduced
                        ? { opacity: 1 }
                        : { opacity: 0, x: value * -64, scale: 1.015, filter: "blur(8px) brightness(0.9)" },
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: reduced ? 0 : 0.74, ease: [0.16, 1, 0.3, 1] }}
                    className={`grid ${gridClass} gap-3 sm:gap-4 lg:gap-5 motion-safe:will-change-[transform,opacity,filter]`}
                  >
                    {visibleCases.map((item, index) => {
                      const caseNumber = ((pageStart + index) % localizedCases.length) + 1;
                      return (
                        <CaseCard
                          key={`${item.slug}-${index}`}
                          item={item}
                          sizes={mediaSizes}
                          priority={currentPage === 0 && index === 0}
                          viewLabel={copy.cases.viewCase}
                          slideLabel={copy.cases.slideLabel(caseNumber, localizedCases.length, item.title)}
                        />
                      );
                    })}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-7 flex justify-end border-t border-gold/25 pt-6">
                  <div className="flex items-center justify-end gap-2">
                    {!reduced && totalPages > 1 ? (
                      <button
                        type="button"
                        onClick={() => setAutoplayPaused((paused) => !paused)}
                        className="grid size-11 place-items-center rounded-control border border-gold/25 text-mist transition-colors hover:border-gold/60 hover:text-gold"
                        aria-label={autoplayPaused ? copy.cases.resumeAutoplay : copy.cases.pauseAutoplay}
                        aria-pressed={autoplayPaused}
                      >
                        {autoplayPaused ? <Play className="size-4" strokeWidth={1.5} aria-hidden="true" /> : <Pause className="size-4" strokeWidth={1.5} aria-hidden="true" />}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => changePage(-1)}
                      disabled={totalPages <= 1}
                      className="grid size-11 place-items-center rounded-control border border-gold/25 text-bone transition-colors hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={copy.cases.previousPage}
                    >
                      <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => changePage(1)}
                      disabled={totalPages <= 1}
                      className="grid size-11 place-items-center rounded-control border border-gold/25 text-bone transition-colors hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={copy.cases.nextPage}
                    >
                      <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <p className="sr-only">{copy.cases.pageStatus(currentPage + 1, totalPages)}</p>
              </div>
            )}
          </div>
        </Container>
      </div>
    </Section>
  );
}
