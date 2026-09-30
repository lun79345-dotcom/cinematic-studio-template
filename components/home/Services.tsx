"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Clapperboard, Film, WandSparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Boxes } from "@/components/ui/background-boxes";
import { CometCard } from "@/components/ui/comet-card";
import { EvervaultCard } from "@/components/ui/evervault-card";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { TracingBeam } from "@/components/ui/tracing-beam";
import type { HomeService } from "@/types/home-content";
import { withBasePath } from "@/lib/base-path";

const serviceIcons: Record<HomeService["iconKey"], LucideIcon> = {
  film: Film,
  "book-open": BookOpen,
  "wand-sparkles": WandSparkles,
  clapperboard: Clapperboard,
};

const HOME_VIDEO_PREVIEW_SECONDS = 8;

function ServiceMedia({
  service,
  reduced,
}: {
  service: Pick<HomeService, "media" | "imagePosition"> & { imageAlt: string };
  reduced: boolean | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sharedClassName = "h-full w-full object-cover brightness-[0.92] saturate-[0.72] transition duration-700 ease-expo group-hover:scale-[1.045] group-hover:brightness-100 group-hover:saturate-100";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduced === false) {
      void video.play().catch(() => undefined);
      return;
    }
    video.pause();
  }, [reduced, service.media.type]);

  if (service.media.type === "image") {
    return (
      <Image
        src={withBasePath(service.media.src)}
        alt={service.imageAlt}
        fill
        sizes="(max-width: 1023px) 100vw, 58vw"
        className={sharedClassName}
        style={{ objectPosition: service.imagePosition }}
      />
    );
  }

  if (reduced && service.media.poster) {
    return (
      <Image
        src={withBasePath(service.media.poster)}
        alt={service.imageAlt}
        fill
        sizes="(max-width: 1023px) 100vw, 58vw"
        className={sharedClassName}
        style={{ objectPosition: service.imagePosition }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={withBasePath(service.media.src)}
      poster={service.media.poster ? withBasePath(service.media.poster) : undefined}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={service.imageAlt}
      onTimeUpdate={(event) => {
        if (event.currentTarget.currentTime >= HOME_VIDEO_PREVIEW_SECONDS) {
          event.currentTarget.currentTime = 0;
        }
      }}
      className={sharedClassName}
      style={{ objectPosition: service.imagePosition }}
    />
  );
}

function DesktopServiceBoxes() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1440px) and (hover: hover) and (pointer: fine)");
    const update = () => setVisible(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!visible) return null;

  const gutterWidth = "max(7rem, calc((100% - 1400px) / 2 + 4.5rem))";

  return (
    <>
      <div
        className="absolute inset-y-0 left-0 z-[1]"
        style={{
          width: gutterWidth,
          WebkitMaskImage: "linear-gradient(to right, black 0%, black 68%, transparent 100%)",
          maskImage: "linear-gradient(to right, black 0%, black 68%, transparent 100%)",
        }}
      >
        <Boxes side="left" />
      </div>
      <div
        className="absolute inset-y-0 right-0 z-[1]"
        style={{
          width: gutterWidth,
          WebkitMaskImage: "linear-gradient(to left, black 0%, black 68%, transparent 100%)",
          maskImage: "linear-gradient(to left, black 0%, black 68%, transparent 100%)",
        }}
      >
        <Boxes side="right" />
      </div>
    </>
  );
}

// 首页服务的内容与顺序来自后台配置。
export function Services({ services }: { services: HomeService[] }) {
  const reduced = useReducedMotion();
  const { copy, locale } = usePreferences();
  const localizedServices = services.filter((service) => service.showOnHome).map((service) => ({
    ...service,
    name: service.name[locale] || service.name.zh,
    label: service.label[locale] || service.label.zh,
    description: service.description[locale] || service.description.zh,
    features: service.features[locale].length ? service.features[locale] : service.features.zh,
    imageAlt: service.imageAlt[locale] || service.imageAlt.zh,
    icon: serviceIcons[service.iconKey],
  }));

  if (!localizedServices.length) return null;

  return (
    <Section id="services" className="isolate scroll-mt-[72px] overflow-hidden border-y border-gold/10 bg-ink">
      <div className="pointer-events-none absolute inset-0 bg-stage-grid bg-[length:64px_64px] opacity-25" aria-hidden="true" />
      <DesktopServiceBoxes />
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-px origin-center bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        initial={reduced ? false : { opacity: 0, scaleX: 0.08 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: reduced ? 0 : 1.05, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden="true"
      />

      <TracingBeam className="relative z-10 mx-auto w-full max-w-content">
        <Container className="relative px-9 sm:px-16 lg:px-20">
          <Reveal className="mx-auto max-w-4xl text-center">
          <p className="marketing-meta inline-flex items-center gap-2 font-mono uppercase tracking-[0.2em] text-gold">
            <span className="h-px w-6 bg-gold" aria-hidden="true" />
            {copy.services.eyebrow}
          </p>
          <h2 className={`mt-7 text-balance text-4xl leading-[1.18] sm:text-5xl lg:text-6xl min-[1920px]:text-[4.5rem] ${locale === "en" ? "font-sans font-[450] tracking-[-0.025em]" : "font-cn font-medium tracking-[0.01em]"}`}>
            {copy.services.title.split("\n").map((line) => <span key={line} className="block text-balance">{line}</span>)}
          </h2>
          <p className="marketing-copy mx-auto mt-6 max-w-[70ch] text-pretty text-mist">
            {copy.services.description}
          </p>
          </Reveal>

          <div className="mt-20 space-y-24 sm:mt-24 sm:space-y-28 lg:mt-32 lg:space-y-0 lg:divide-y lg:divide-[#debd87]/40">
            {localizedServices.map((service, index) => {
            const Icon = service.icon;
            const reversed = index % 2 === 1;

            return (
              <article
                key={service.slug}
                className="grid items-stretch gap-10 sm:gap-14 lg:grid-cols-12 lg:gap-x-8 lg:py-20 lg:first:pt-0 lg:last:pb-0"
              >
                <EvervaultCard
                  data-service-intro-card
                  className={`lg:col-span-4 ${reversed ? "lg:col-start-9" : "lg:col-start-1"}`}
                >
                  <div className="flex h-full flex-col p-6 sm:p-8 lg:p-8 xl:p-10">
                    <div>
                      <div className="flex items-center gap-3 text-gold">
                        <Icon className="size-4" strokeWidth={1.35} aria-hidden="true" />
                        <p className={`marketing-meta font-mono ${locale === "en" ? "uppercase tracking-[0.1em]" : "tracking-[0.06em]"}`}>
                          {String(index + 1).padStart(2, "0")} / {service.label}
                        </p>
                      </div>

                      <h3 className={`mt-7 text-balance ${locale === "en" ? "font-serif text-[2rem] font-light leading-[1.15] tracking-[-0.025em] sm:text-[2.35rem] lg:text-[2.5rem] min-[1920px]:text-[3.2rem]" : "font-cn text-[2.25rem] font-medium leading-[1.18] tracking-[0.01em] sm:text-[2.75rem] lg:text-[2.7rem] xl:text-[3rem] min-[1920px]:text-[3.35rem]"}`}>
                        {service.name}
                      </h3>
                      <p className="marketing-copy mt-5 max-w-[38ch] text-pretty text-mist">
                        {service.description}
                      </p>

                      <ul className="mt-8 space-y-3.5 border-t border-gold/15 pt-6" aria-label={copy.services.listLabel(service.name)}>
                        {service.features.map((feature) => (
                          <li key={feature} className="service-feature-copy flex items-start gap-3 text-bone/82">
                            <ArrowUpRight className="mt-1.5 size-3.5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden="true" />
                            <span className="text-pretty">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href={`/services/${service.slug}`}
                      className="site-nav-type group mt-10 inline-flex min-h-11 w-fit items-center gap-3 border-b border-gold/35 pb-1 text-gold transition-colors duration-300 hover:border-gold hover:text-bone lg:mt-auto lg:pt-10"
                    >
                      {copy.services.view}
                      <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                  </div>
                </EvervaultCard>

                <CometCard
                  className={`lg:col-span-7 lg:h-full ${
                    reversed ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-6"
                  }`}
                >
                  <Link
                    href={`/services/${service.slug}`}
                    aria-label={copy.services.cardLabel(service.name)}
                    className="service-visual-shadow group relative block aspect-[6/5] w-full overflow-hidden border border-gold/20 bg-carbon sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[30rem] xl:min-h-[32rem] min-[1920px]:min-h-[36rem]"
                  >
                    <ServiceMedia service={service} reduced={reduced} />
                    <div className="absolute inset-0 bg-gold/10 mix-blend-color transition-opacity duration-500 group-hover:opacity-45" aria-hidden="true" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/10" aria-hidden="true" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" aria-hidden="true" />

                    <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 sm:inset-x-7 sm:bottom-7">
                      <div>
                        <p className="marketing-meta font-mono uppercase tracking-[0.18em] text-gold/80">Studio Template / Service</p>
                        <p className={`mt-2 text-2xl text-onMedia sm:text-3xl min-[1920px]:text-4xl ${locale === "en" ? "font-serif font-light" : "font-cn font-medium tracking-[0.01em]"}`}>{service.name}</p>
                      </div>
                      <span className="grid size-11 shrink-0 place-items-center border border-gold/45 bg-black/65 text-gold backdrop-blur-md transition-colors duration-300 group-hover:bg-gold group-hover:text-ink">
                        <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </CometCard>
              </article>
            );
            })}
          </div>
        </Container>
      </TracingBeam>
    </Section>
  );
}
