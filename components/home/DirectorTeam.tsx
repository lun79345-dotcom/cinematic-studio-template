"use client";

import Image from "next/image";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { withBasePath } from "@/lib/base-path";
import { directorTeam } from "@/lib/director-team";

export function DirectorTeam() {
  const { copy, locale } = usePreferences();

  return (
    <Section id="directors" className="relative overflow-hidden bg-ink pb-16 pt-0 sm:pb-20 sm:pt-0 lg:pb-24 lg:pt-0 min-[1920px]:pb-28 min-[1920px]:pt-0">
      <Container>
        <div className="border-t border-gold/30 pt-10 sm:pt-14 lg:pt-20">
          <Reveal className="mx-auto max-w-4xl text-center">
            <p className="marketing-meta inline-flex items-center gap-2 font-mono uppercase tracking-[0.2em] text-gold">
              <span className="h-px w-6 bg-gold" aria-hidden="true" />
              {copy.directors.label}
            </p>
            <h2 className={`mt-7 whitespace-pre-line text-balance text-4xl leading-[1.18] sm:text-5xl lg:text-6xl min-[1920px]:text-[4.5rem] ${locale === "en" ? "font-sans font-[450] tracking-[-0.025em]" : "font-cn font-medium tracking-[0.01em]"}`}>
              <span className="whitespace-pre-line">{copy.directors.title}</span>
            </h2>
            <p className="marketing-copy mx-auto mt-6 max-w-[70ch] text-pretty text-mist">
              {copy.directors.description}
            </p>
          </Reveal>

          <div className="mt-12 sm:mt-16 lg:mt-20 lg:grid lg:grid-cols-3">
            {directorTeam.map((portrait, index) => {
              const person = copy.directors.people[portrait.key];
              return (
                <Reveal key={portrait.key} delay={index * 0.08} className="relative min-w-0">
                  <article className="grid min-w-0 gap-7 py-8 sm:grid-cols-[minmax(220px,0.82fr)_minmax(0,1.18fr)] sm:items-center sm:gap-10 lg:block lg:px-4 lg:py-0 xl:px-5 min-[1920px]:px-7">
                    <div className="relative aspect-[4/5] min-w-0 overflow-hidden bg-panel">
                      <Image
                        src={withBasePath(portrait.image)}
                        alt={person.imageAlt}
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 42vw, 33vw"
                        priority={index === 0}
                        className="object-cover"
                        style={{ objectPosition: portrait.imagePosition }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgb(var(--color-canvas)/0.42)_100%)]" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 pb-1 lg:py-7">
                      <div className="flex min-w-0 items-baseline justify-between gap-4">
                        <h3 className={`min-w-0 text-balance text-3xl text-bone ${locale === "en" ? "font-serif font-light tracking-[-0.03em]" : "font-cn font-medium tracking-[0.01em]"}`}>
                          {person.name}
                        </h3>
                        <span className="shrink-0 font-mono text-[11px] text-gold/72">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-6 text-gold">{person.role}</p>
                      <p className="mt-5 max-w-[54ch] text-pretty text-sm leading-7 text-mist min-[1920px]:text-base">
                        {person.description}
                      </p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
