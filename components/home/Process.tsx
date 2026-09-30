"use client";

import { Check } from "lucide-react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

// 流程区用文字宣言和竖向时间线形成清晰的左右叙事关系。
export function Process() {
  const { copy } = usePreferences();
  return (
    <Section id="about">
      <Container className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
        <Reveal>
          <h2 className="whitespace-pre-line text-balance font-serif text-5xl leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">{copy.process.title}</h2>
          <p className="mt-7 max-w-lg leading-8 text-mist">{copy.process.description}</p>
        </Reveal>

        <div className="relative border-l border-line/15 pl-7 sm:pl-10">
          {copy.process.items.map(([title, description], index) => (
            <Reveal key={title} delay={index * 0.07} className="relative pb-12 last:pb-0 sm:pb-16">
              <div className="absolute -left-[2.55rem] top-1 grid size-7 place-items-center rounded-full border border-gold/45 bg-ink text-gold sm:-left-[3.45rem]">
                <Check className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl">{title}</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-mist">{description}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
