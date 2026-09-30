"use client";

import { usePreferences } from "@/components/providers/PreferencesProvider";
import { localizeCase } from "@/lib/i18n";
import type { CaseStudy } from "@/types/case";

export function CaseTitle({ item }: { item: CaseStudy }) {
  const { locale } = usePreferences();
  const title = localizeCase(item, locale).title;
  // 短中文词组保持完整；较长标题仍可在窄屏自然换行。
  const phrases = title.match(/[^，｜]+[，｜]?/g) ?? [title];
  return (
    <h1 className="mt-6 font-sans text-[2rem] font-semibold leading-[1.18] tracking-[-0.03em] sm:text-6xl lg:text-[5.25rem]">
      {phrases.map((phrase, index) => <span key={index} className={locale === "zh" && phrase.length <= 6 ? "inline-block" : undefined}>{phrase}</span>)}
    </h1>
  );
}
