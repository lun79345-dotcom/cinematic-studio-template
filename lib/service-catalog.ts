export const serviceSlugs = [
  "visual-storytelling",
  "digital-experiences",
  "creative-training",
] as const;

export type ServiceSlug = (typeof serviceSlugs)[number];

const serviceSlugSet = new Set<string>(serviceSlugs);

export function isServiceSlug(value: string): value is ServiceSlug {
  return serviceSlugSet.has(value);
}
