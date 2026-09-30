"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { Container } from "@/components/ui/Container";
import type { Service, ServiceNavigationItem } from "@/types/home-content";
import type { ContactSettings } from "@/types/site-settings";
import { withBasePath } from "@/lib/base-path";

function ServiceHeroMedia({ service }: { service: Service }) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { locale } = usePreferences();
  const alt = service.imageAlt[locale] || service.imageAlt.zh;
  const mediaClassName = "size-full object-cover brightness-[0.94] saturate-[0.96] contrast-[1.02]";

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
        alt={alt}
        fill
        priority
        sizes="100vw"
        className={mediaClassName}
        style={{ objectPosition: service.imagePosition }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={withBasePath(service.media.src)}
      poster={service.media.poster ? withBasePath(service.media.poster) : undefined}
      controls
      muted
      loop
      playsInline
      preload="auto"
      aria-label={alt}
      className={mediaClassName}
      style={{ objectPosition: service.imagePosition }}
    />
  );
}

export function ServiceDetail({
  service,
  services,
  contact,
}: {
  service: Service;
  services: ServiceNavigationItem[];
  contact: ContactSettings;
}) {
  const { copy, locale } = usePreferences();
  const name = service.name[locale] || service.name.zh;
  const label = service.label[locale] || service.label.zh;
  const sectionLabel = locale === "zh" ? "服务介绍" : "Service overview";
  const backLabel = locale === "zh" ? "返回首页" : "Back to home";
  const consultLabel = locale === "zh" ? "咨询此服务" : "Discuss this service";
  const ctaTitle = locale === "zh" ? "让这项能力服务于你的下一个项目" : "Put this capability to work on your next project";

  return (
    <main className="min-h-[100dvh] bg-ink text-bone">
      <Navbar services={services} />

      <section className="border-b border-gold/15 bg-ink pb-12 pt-24 sm:pb-14 sm:pt-28 lg:pb-16 lg:pt-32">
        <Container className="max-w-[1448px]">
          <div
            className={`relative aspect-video overflow-hidden rounded-card border border-line/20 bg-panel shadow-[0_18px_54px_rgb(8_7_5/0.10)] ${service.media.type === "image" ? "sm:aspect-[2/1] lg:aspect-[2.12/1]" : ""}`}
            data-service-hero-player
          >
            <ServiceHeroMedia service={service} />
            {service.media.type === "video" ? (
              <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-bone/70 px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.12em] text-ink backdrop-blur-sm sm:right-5 sm:top-5">
                SHOWREEL 2026 / 01
              </span>
            ) : null}
          </div>

          <div
            className="flex flex-col gap-8 pt-9 sm:pt-11 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:pt-12"
            data-service-hero-copy
          >
            <div className="min-w-0">
              <p className="flex items-center gap-3 text-xs font-medium tracking-[0.08em] text-gold">
                <span className="h-px w-8 bg-gold/65" aria-hidden="true" />
                {sectionLabel} · {label}
              </p>
              <h1 className={`mt-3 text-balance text-[clamp(2.75rem,4.5vw,4.75rem)] font-light leading-[1.04] tracking-[-0.035em] ${locale === "en" ? "font-serif" : "font-display"}`}>
                {name}
              </h1>
            </div>
            <div className="flex flex-nowrap items-center gap-3 lg:shrink-0 lg:pb-1">
              <Link href="/contact" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-control bg-gold px-5 text-sm font-medium text-ink transition-colors hover:bg-accentHover focus-visible:outline-offset-4 active:scale-[0.98] sm:min-h-14 sm:px-8">
                {consultLabel}<ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </Link>
              <Link href="/" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-control border border-line/35 px-5 text-sm text-bone transition-colors hover:border-gold/60 hover:text-gold focus-visible:outline-offset-4 sm:min-h-14 sm:px-8">
                <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />{backLabel}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <div className="bg-ink">
        {service.sections.map((section, index) => {
          const heading = section.heading[locale] || section.heading.zh;
          const body = section.body[locale] || section.body.zh;
          const imageAlt = section.imageAlt ? section.imageAlt[locale] || section.imageAlt.zh : "";
          const hasImage = Boolean(section.image);

          return (
            <section key={`${service.slug}-${index}`} className="border-b border-line/10 py-20 sm:py-28 lg:py-36">
              <Container>
                <div className={`grid items-center gap-12 lg:gap-20 ${hasImage ? "lg:grid-cols-12" : ""}`}>
                  <div className={`${hasImage ? `lg:col-span-5 ${index % 2 ? "lg:col-start-8" : ""}` : "mx-auto max-w-[780px]"}`}>
                    <p className="font-mono text-[0.68rem] tracking-[0.16em] text-gold/70">{String(index + 1).padStart(2, "0")}</p>
                    {heading ? <h2 className={`mt-5 text-balance text-3xl font-light leading-tight tracking-[-0.025em] sm:text-4xl lg:text-5xl ${locale === "en" ? "font-serif" : "font-display"}`}>{heading}</h2> : null}
                    <div className={`${heading ? "mt-7" : "mt-5"} space-y-5 text-pretty text-base leading-8 text-bone/70 sm:text-lg sm:leading-9`}>
                      {body.split(/\n\s*\n/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  </div>

                  {section.image ? (
                    <div className={`relative aspect-[4/3] overflow-hidden bg-panel lg:col-span-6 ${index % 2 ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-7"}`}>
                      <Image src={withBasePath(section.image)} alt={imageAlt} fill sizes="(max-width: 1023px) 100vw, 52vw" className="object-cover" />
                    </div>
                  ) : null}
                </div>
              </Container>
            </section>
          );
        })}
      </div>

      <section className="border-b border-gold/15 bg-carbon py-20 sm:py-28">
        <Container className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className={`max-w-[16ch] text-balance text-4xl font-light leading-tight tracking-[-0.03em] sm:text-5xl ${locale === "en" ? "font-serif" : "font-display"}`}>{ctaTitle}</h2>
          <Link href="/contact" className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-control bg-gold px-6 text-sm font-medium text-ink transition-colors hover:bg-accentHover active:scale-[0.98]">
            {copy.nav.start}<ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </Container>
      </section>

      <Footer settings={contact} services={services} />
    </main>
  );
}
