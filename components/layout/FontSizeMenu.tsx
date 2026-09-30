"use client";

import { PreferenceMenu } from "@/components/layout/PreferenceMenu";
import { usePreferences, type ContentFontSize } from "@/components/providers/PreferencesProvider";

const sizeOrder: ContentFontSize[] = ["sm", "md", "lg", "xl"];
const triggerTextSizes: Record<ContentFontSize, string> = {
  sm: "text-[13px]",
  md: "text-[15px]",
  lg: "text-[17px]",
  xl: "text-[19px]",
};

export function FontSizeMenu({ tone = "default" }: { tone?: "default" | "training" }) {
  const { contentFontSize, copy, setContentFontSize } = usePreferences();
  const labels = {
    sm: copy.fontSizeMenu.small,
    md: copy.fontSizeMenu.medium,
    lg: copy.fontSizeMenu.large,
    xl: copy.fontSizeMenu.extraLarge,
  } satisfies Record<ContentFontSize, string>;

  return (
    <PreferenceMenu<ContentFontSize>
      id="content-font-size-menu"
      ariaLabel={copy.a11y.fontSize}
      trigger={<span className={`${triggerTextSizes[contentFontSize]} whitespace-nowrap font-medium leading-none tracking-[-0.02em]`} aria-hidden="true">{copy.preferenceTriggers.fontSize}</span>}
      options={sizeOrder.map((size) => ({ value: size, label: labels[size], selected: contentFontSize === size }))}
      onSelect={setContentFontSize}
      tone={tone}
    />
  );
}
