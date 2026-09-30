"use client";

import { PreferenceMenu } from "@/components/layout/PreferenceMenu";
import { usePreferences, type ContentFontSize } from "@/components/providers/PreferencesProvider";
import type { Locale } from "@/lib/i18n";

const triggerTextSizes: Record<ContentFontSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function LanguageMenu({ tone = "default" }: { tone?: "default" | "training" }) {
  const { contentFontSize, copy, locale, setLocale } = usePreferences();

  return (
    <PreferenceMenu<Locale>
      id="language-preference-menu"
      ariaLabel={copy.a11y.language}
      trigger={<span className={`${triggerTextSizes[contentFontSize]} whitespace-nowrap font-medium leading-none`} aria-hidden="true">{copy.preferenceTriggers.language}</span>}
      options={[
        { value: "zh", label: "中文", selected: locale === "zh" },
        { value: "en", label: "English", selected: locale === "en" },
      ]}
      onSelect={setLocale}
      tone={tone}
    />
  );
}
