"use client";

import Image from "next/image";
import { useMemo } from "react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import type { HomeBrand } from "@/types/home-content";
import { withBasePath } from "@/lib/base-path";

function BrandSequence({ brands, duplicate = false, uniqueCount }: { brands: HomeBrand[]; duplicate?: boolean; uniqueCount: number }) {
  const { locale } = usePreferences();
  return (
    <div className="trust-brand-sequence" aria-hidden={duplicate || undefined}>
      {brands.map((brand, index) => {
        return <div key={`${brand.id}-${index}`} className="trust-brand-item" aria-hidden={index >= uniqueCount || undefined}>
          <span className="trust-brand-mark">
            <Image
              src={withBasePath(brand.logo)}
              alt={brand.name[locale] || brand.name.zh || brand.name.en}
              fill
              sizes="(min-width: 640px) 152px, 128px"
              className="object-contain"
              unoptimized
            />
          </span>
        </div>
      })}
    </div>
  );
}

export function Trust({ brands }: { brands: HomeBrand[] }) {
  const { copy, locale } = usePreferences();
  const visibleBrands = useMemo(() => brands.filter((brand) => brand.visible), [brands]);
  const marqueeBrands = useMemo(() => {
    if (!visibleBrands.length) return [];
    const length = Math.max(visibleBrands.length, 8);
    return Array.from({ length }, (_, index) => visibleBrands[index % visibleBrands.length]);
  }, [visibleBrands]);

  if (!visibleBrands.length) return null;

  return (
    <section id="trust" className="scroll-mt-20 overflow-hidden border-y border-gold/20 bg-carbon py-12 sm:py-16">
      <Container>
        <Reveal>
          <p className="text-center text-sm text-mist">{copy.trust}</p>
        </Reveal>
      </Container>

      <Reveal className="mt-9" delay={0.08}>
        <div
          className="trust-brand-marquee"
          role="group"
          aria-label={locale === "zh" ? "合作品牌 Logo 展示" : "Selected partner logos"}
        >
          <div className="trust-brand-track">
            <BrandSequence brands={marqueeBrands} uniqueCount={visibleBrands.length} />
            <BrandSequence brands={marqueeBrands} uniqueCount={visibleBrands.length} duplicate />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
