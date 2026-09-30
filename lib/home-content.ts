import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import bundledHomeContent from "@/data/home-content.json";
import type {
  HomeBrand,
  HomeBrandInput,
  HomeContent,
  HomeService,
  HomeServiceIconKey,
  HomeServiceInput,
  HomeServiceMedia,
  Localized,
  ServiceSection,
} from "@/types/home-content";

const HOME_CONTENT_FILE = path.join(process.cwd(), "data", "home-content.json");
const MAX_BRANDS = 100;
const MAX_HOME_CASES = 20;
const MAX_SERVICES = 50;

const brandInputKeys = ["name", "logo", "visible"] as const;

const serviceInputKeys = [
  "slug",
  "name",
  "label",
  "description",
  "seoDescription",
  "features",
  "sections",
  "media",
  "imageAlt",
  "imagePosition",
  "iconKey",
  "showOnHome",
  "showInNavigation",
] as const;

const serviceSectionKeys = ["heading", "body", "image", "imageAlt"] as const;

export class HomeContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HomeContentValidationError";
  }
}

function fail(message: string): never {
  throw new HomeContentValidationError(message);
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label}\u5fc5\u987b\u662f\u5bf9\u8c61`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeys(record: Record<string, unknown>, keys: readonly string[], label: string) {
  const allowed = new Set(keys);
  const extra = Object.keys(record).filter((key) => !allowed.has(key));
  if (extra.length) fail(`${label}\u5305\u542b\u672a\u652f\u6301\u7684\u5b57\u6bb5\uff1a${extra.join("\u3001")}`);
}

function parseText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string") fail(`${label}\u5fc5\u987b\u662f\u5b57\u7b26\u4e32`);
  const clean = value.trim();
  if (!clean) fail(`${label}\u4e0d\u80fd\u4e3a\u7a7a`);
  if (clean.length > maxLength) fail(`${label}\u4e0d\u80fd\u8d85\u8fc7 ${maxLength} \u4e2a\u5b57\u7b26`);
  return clean;
}

function parseBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") fail(`${label}\u5fc5\u987b\u662f\u5e03\u5c14\u503c`);
  return value;
}

function parseLocalizedText(value: unknown, label: string, maxLength: number): Localized<string> {
  const record = asRecord(value, label);
  assertExactKeys(record, ["zh", "en"], label);
  return {
    zh: parseText(record.zh, `${label}.zh`, maxLength),
    en: parseOptionalText(record.en, `${label}.en`, maxLength),
  };
}

function parseOptionalText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string") fail(`${label}\u5fc5\u987b\u662f\u5b57\u7b26\u4e32`);
  const clean = value.trim();
  if (clean.length > maxLength) fail(`${label}\u4e0d\u80fd\u8d85\u8fc7 ${maxLength} \u4e2a\u5b57\u7b26`);
  return clean;
}

function parseLocalizedOptionalText(value: unknown, label: string, maxLength: number): Localized<string> {
  const record = asRecord(value, label);
  assertExactKeys(record, ["zh", "en"], label);
  return {
    zh: parseOptionalText(record.zh, `${label}.zh`, maxLength),
    en: parseOptionalText(record.en, `${label}.en`, maxLength),
  };
}

function parseTextList(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) fail(`${label}\u5fc5\u987b\u662f\u6570\u7ec4`);
  if (value.length < 1 || value.length > 6) fail(`${label}\u5fc5\u987b\u5305\u542b 1 \u5230 6 \u9879`);
  return value.map((item, index) => parseText(item, `${label}[${index}]`, 120));
}

function parseOptionalTextList(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) fail(`${label}\u5fc5\u987b\u662f\u6570\u7ec4`);
  if (value.length > 6) fail(`${label}\u4e0d\u80fd\u8d85\u8fc7 6 \u9879`);
  return value.map((item, index) => parseText(item, `${label}[${index}]`, 120));
}

function parseLocalizedTextList(value: unknown, label: string): Localized<string[]> {
  const record = asRecord(value, label);
  assertExactKeys(record, ["zh", "en"], label);
  return {
    zh: parseTextList(record.zh, `${label}.zh`),
    en: parseOptionalTextList(record.en, `${label}.en`),
  };
}

function parseId(value: unknown, label: string) {
  const id = parseText(value, label, 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail(`${label}\u683c\u5f0f\u65e0\u6548`);
  return id;
}

function parseSlug(value: unknown, label: string) {
  const slug = parseText(value, label, 80).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(`${label}\u53ea\u80fd\u5305\u542b\u5c0f\u5199\u5b57\u6bcd\u3001\u6570\u5b57\u548c\u8fde\u5b57\u7b26`);
  }
  return slug;
}

function parseServiceSlug(value: unknown, label: string) {
  return parseSlug(value, label);
}

function parseAssetPath(value: unknown, label: string) {
  const assetPath = parseText(value, label, 300);
  if (
    !assetPath.startsWith("/")
    || assetPath === "/"
    || assetPath.includes("..")
    || assetPath.includes("\\")
    || assetPath.includes("//")
    || assetPath.includes("?")
    || assetPath.includes("#")
    || assetPath.includes("%")
    || /[\u0000-\u001f\u007f]/.test(assetPath)
  ) {
    fail(`${label}\u5fc5\u987b\u662f public \u76ee\u5f55\u4e0b\u7684\u5b89\u5168\u7ad9\u5185\u8def\u5f84`);
  }
  return assetPath;
}

const imageExtensions = new Set(["avif", "bmp", "gif", "heic", "heif", "jpeg", "jpg", "png", "svg", "webp"]);
const videoExtensions = new Set(["m4v", "mov", "mp4", "mpeg", "mpg", "ogv", "webm"]);

function parseTypedAssetPath(value: unknown, label: string, kind: "image" | "video") {
  const assetPath = parseAssetPath(value, label);
  const extension = assetPath.split(".").pop()?.toLowerCase();
  const allowed = kind === "image" ? imageExtensions : videoExtensions;
  if (!extension || !allowed.has(extension)) {
    fail(`${label}\u5fc5\u987b\u6307\u5411\u6709\u6548\u7684${kind === "image" ? "\u56fe\u7247" : "\u89c6\u9891"}\u6587\u4ef6`);
  }
  return assetPath;
}

function parseServiceMedia(value: unknown, label: string): HomeServiceMedia {
  const record = asRecord(value, label);
  if (record.type === "image") {
    assertExactKeys(record, ["type", "src"], label);
    return {
      type: "image",
      src: parseTypedAssetPath(record.src, `${label}.src`, "image"),
    };
  }
  if (record.type === "video") {
    assertExactKeys(record, ["type", "src", "poster"], label);
    return {
      type: "video",
      src: parseTypedAssetPath(record.src, `${label}.src`, "video"),
      ...(record.poster === undefined
        ? {}
        : { poster: parseTypedAssetPath(record.poster, `${label}.poster`, "image") }),
    };
  }
  fail(`${label}.type\u5fc5\u987b\u662f image \u6216 video`);
}

function parseImagePosition(value: unknown, label: string) {
  const position = parseText(value, label, 32).replace(/\s+/g, " ");
  const parts = position.split(" ");
  if (parts.length > 2 || !parts.every((part) => {
    if (["left", "center", "right", "top", "bottom"].includes(part)) return true;
    const match = /^(\d{1,3})%$/.exec(part);
    return Boolean(match && Number(match[1]) <= 100);
  })) {
    fail(`${label}\u5fc5\u987b\u662f\u6709\u6548\u7684 object-position \u503c`);
  }
  return position;
}

function parseTimestamp(value: unknown, label: string) {
  const timestamp = parseText(value, label, 40);
  if (!Number.isFinite(Date.parse(timestamp))) fail(`${label}\u5fc5\u987b\u662f\u6709\u6548\u65f6\u95f4`);
  return timestamp;
}

function parseIconKey(value: unknown, label: string): HomeServiceIconKey {
  if (value !== "film" && value !== "book-open" && value !== "wand-sparkles" && value !== "clapperboard") {
    fail(`${label}\u4e0d\u5728\u5141\u8bb8\u7684\u56fe\u6807\u5217\u8868\u4e2d`);
  }
  return value;
}

function parseBrandFields(record: Record<string, unknown>, label: string): HomeBrandInput {
  return {
    name: parseLocalizedText(record.name, `${label}.name`, 80),
    logo: parseTypedAssetPath(record.logo, `${label}.logo`, "image"),
    visible: parseBoolean(record.visible, `${label}.visible`),
  };
}

function parseBrandInput(value: unknown, label = "brand"): HomeBrandInput {
  const record = asRecord(value, label);
  assertExactKeys(record, brandInputKeys, label);
  return parseBrandFields(record, label);
}

function parseBrand(value: unknown, label: string): HomeBrand {
  const record = asRecord(value, label);
  assertExactKeys(record, ["id", ...brandInputKeys, "createdAt", "updatedAt"], label);
  return {
    id: parseId(record.id, `${label}.id`),
    ...parseBrandFields(record, label),
    createdAt: parseTimestamp(record.createdAt, `${label}.createdAt`),
    updatedAt: parseTimestamp(record.updatedAt, `${label}.updatedAt`),
  };
}

function parseServiceSection(value: unknown, label: string): ServiceSection {
  const record = asRecord(value, label);
  assertExactKeys(record, serviceSectionKeys, label);
  const image = record.image === undefined ? undefined : parseTypedAssetPath(record.image, `${label}.image`, "image");
  const imageAlt = record.imageAlt === undefined
    ? undefined
    : parseLocalizedText(record.imageAlt, `${label}.imageAlt`, 240);
  if (image && !imageAlt) fail(`${label}.imageAlt\u4e0d\u80fd\u4e3a\u7a7a`);
  if (!image && imageAlt) fail(`${label}.imageAlt\u53ea\u80fd\u4e0e image \u4e00\u8d77\u63d0\u4ea4`);
  return {
    heading: parseLocalizedOptionalText(record.heading, `${label}.heading`, 160),
    body: parseLocalizedText(record.body, `${label}.body`, 6000),
    ...(image ? { image, imageAlt } : {}),
  };
}

function parseServiceSections(value: unknown, label: string) {
  if (!Array.isArray(value)) fail(`${label}\u5fc5\u987b\u662f\u6570\u7ec4`);
  if (value.length < 1 || value.length > 12) fail(`${label}\u5fc5\u987b\u5305\u542b 1 \u5230 12 \u4e2a\u6bb5\u843d`);
  return value.map((section, index) => parseServiceSection(section, `${label}[${index}]`));
}

function parseServiceFields(record: Record<string, unknown>, label: string): HomeServiceInput {
  return {
    slug: parseServiceSlug(record.slug, `${label}.slug`),
    name: parseLocalizedText(record.name, `${label}.name`, 100),
    label: parseLocalizedText(record.label, `${label}.label`, 100),
    description: parseLocalizedText(record.description, `${label}.description`, 600),
    ...(record.seoDescription === undefined ? {} : { seoDescription: parseLocalizedOptionalText(record.seoDescription, `${label}.seoDescription`, 600) }),
    features: parseLocalizedTextList(record.features, `${label}.features`),
    sections: parseServiceSections(record.sections, `${label}.sections`),
    media: parseServiceMedia(record.media, `${label}.media`),
    imageAlt: parseLocalizedText(record.imageAlt, `${label}.imageAlt`, 240),
    imagePosition: parseImagePosition(record.imagePosition, `${label}.imagePosition`),
    iconKey: parseIconKey(record.iconKey, `${label}.iconKey`),
    showOnHome: parseBoolean(record.showOnHome, `${label}.showOnHome`),
    showInNavigation: parseBoolean(record.showInNavigation, `${label}.showInNavigation`),
  };
}

function parseServiceInput(value: unknown, label = "service"): HomeServiceInput {
  const record = asRecord(value, label);
  assertExactKeys(record, serviceInputKeys, label);
  return parseServiceFields(record, label);
}

function parseService(value: unknown, label: string): HomeService {
  const record = asRecord(value, label);
  assertExactKeys(record, ["id", ...serviceInputKeys, "createdAt", "updatedAt"], label);
  return {
    id: parseId(record.id, `${label}.id`),
    ...parseServiceFields(record, label),
    createdAt: parseTimestamp(record.createdAt, `${label}.createdAt`),
    updatedAt: parseTimestamp(record.updatedAt, `${label}.updatedAt`),
  };
}

function parseHomeCaseSlugs(value: unknown, label = "homeCaseSlugs") {
  if (!Array.isArray(value)) fail(`${label}\u5fc5\u987b\u662f\u6570\u7ec4`);
  if (value.length > MAX_HOME_CASES) fail(`${label}\u6700\u591a\u53ea\u80fd\u5305\u542b ${MAX_HOME_CASES} \u4e2a\u6848\u4f8b`);
  const slugs = value.map((slug, index) => parseSlug(slug, `${label}[${index}]`));
  if (new Set(slugs).size !== slugs.length) fail(`${label}\u4e0d\u80fd\u5305\u542b\u91cd\u590d\u9879`);
  return slugs;
}

function parseHomeContent(value: unknown): HomeContent {
  const record = asRecord(value, "homeContent");
  assertExactKeys(record, ["brands", "services", "homeCaseSlugs"], "homeContent");
  if (!Array.isArray(record.brands)) fail("brands\u5fc5\u987b\u662f\u6570\u7ec4");
  if (!Array.isArray(record.services)) fail("services\u5fc5\u987b\u662f\u6570\u7ec4");
  if (record.brands.length > MAX_BRANDS) fail(`brands\u4e0d\u80fd\u8d85\u8fc7 ${MAX_BRANDS} \u9879`);
  if (record.services.length > MAX_SERVICES) fail(`services\u4e0d\u80fd\u8d85\u8fc7 ${MAX_SERVICES} \u9879`);

  const brands = record.brands.map((brand, index) => parseBrand(brand, `brands[${index}]`));
  const services = record.services.map((service, index) => parseService(service, `services[${index}]`));
  const brandIds = brands.map((brand) => brand.id);
  const serviceIds = services.map((service) => service.id);
  const serviceSlugs = services.map((service) => service.slug);
  if (new Set(brandIds).size !== brandIds.length) fail("brands.id\u4e0d\u80fd\u91cd\u590d");
  if (new Set(serviceIds).size !== serviceIds.length) fail("services.id\u4e0d\u80fd\u91cd\u590d");
  if (new Set(serviceSlugs).size !== serviceSlugs.length) fail("services.slug\u4e0d\u80fd\u91cd\u590d");
  return {
    brands,
    services,
    homeCaseSlugs: parseHomeCaseSlugs(record.homeCaseSlugs),
  };
}

// Existing Docker deployments may still use the former fixed-catalog schema.
// Fill newly introduced fields without re-adding services an editor deleted.
function migrateLegacyHomeContent(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.services)) return value;

  const defaults = (bundledHomeContent as unknown as { services: unknown[] }).services;
  const defaultRecords = defaults.filter((service): service is Record<string, unknown> => Boolean(service) && typeof service === "object" && !Array.isArray(service));
  const defaultsBySlug = new Map(defaultRecords.map((service) => [service.slug, service]));
  const existingRecords = record.services.filter((service): service is Record<string, unknown> => Boolean(service) && typeof service === "object" && !Array.isArray(service));
  if (existingRecords.length !== record.services.length) return value;

  const existingSlugs = existingRecords.map((service) => service.slug);
  if (existingSlugs.some((slug) => typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) return value;
  if (new Set(existingSlugs).size !== existingSlugs.length) return value;

  const mergedExisting = existingRecords.map((existing) => {
    const fallback = defaultsBySlug.get(existing.slug) ?? {};
    const { enabled, ...current } = existing;
    return {
      ...fallback,
      ...current,
      sections: existing.sections ?? fallback.sections,
      showOnHome: existing.showOnHome ?? enabled ?? fallback.showOnHome,
      showInNavigation: existing.showInNavigation ?? true,
    };
  });
  return { ...record, services: mergedExisting };
}

async function readHomeContentFile() {
  let raw: string;
  try {
    raw = await fs.readFile(HOME_CONTENT_FILE, "utf8");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
    await initializeHomeContentFile();
    raw = await fs.readFile(HOME_CONTENT_FILE, "utf8");
  }
  return parseHomeContent(migrateLegacyHomeContent(JSON.parse(raw)));
}

// A bind-mounted data directory from an older deployment may not contain this
// newly introduced file. Publish the bundled defaults atomically only when the
// target is absent, so existing production content is never overwritten.
async function initializeHomeContentFile() {
  const clean = parseHomeContent(migrateLegacyHomeContent(bundledHomeContent as unknown));
  const temporaryFile = `${HOME_CONTENT_FILE}.${process.pid}.${randomUUID()}.init`;
  await fs.mkdir(path.dirname(HOME_CONTENT_FILE), { recursive: true });
  try {
    await fs.writeFile(temporaryFile, `${JSON.stringify(clean, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    try {
      await fs.link(temporaryFile, HOME_CONTENT_FILE);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
    }
  } finally {
    await fs.rm(temporaryFile, { force: true }).catch(() => undefined);
  }
}

async function writeHomeContentFile(content: HomeContent) {
  const clean = parseHomeContent(content);
  const temporaryFile = `${HOME_CONTENT_FILE}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryFile, `${JSON.stringify(clean, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await fs.rename(temporaryFile, HOME_CONTENT_FILE);
  } finally {
    await fs.rm(temporaryFile, { force: true }).catch(() => undefined);
  }
}

let writeQueue: Promise<void> = Promise.resolve();

function mutateHomeContent<T>(mutator: (content: HomeContent) => T | Promise<T>): Promise<T> {
  const operation = writeQueue.then(async () => {
    const content = await readHomeContentFile();
    const result = await mutator(content);
    await writeHomeContentFile(content);
    return result;
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

function parseOrder(value: unknown, existingIds: string[], label: string) {
  if (!Array.isArray(value)) fail(`${label}\u5fc5\u987b\u662f\u6570\u7ec4`);
  const ids = value.map((id, index) => parseId(id, `${label}[${index}]`));
  if (new Set(ids).size !== ids.length) fail(`${label}\u4e0d\u80fd\u5305\u542b\u91cd\u590d\u9879`);
  if (ids.length !== existingIds.length || ids.some((id) => !existingIds.includes(id))) {
    fail(`${label}\u5fc5\u987b\u5305\u542b\u5168\u90e8\u73b0\u6709 ID`);
  }
  return ids;
}

export async function getHomeContent() {
  noStore();
  await writeQueue;
  return readHomeContentFile();
}

export function createBrand(input: unknown) {
  const clean = parseBrandInput(input);
  return mutateHomeContent((content) => {
    if (content.brands.length >= MAX_BRANDS) fail(`\u5408\u4f5c\u54c1\u724c\u4e0d\u80fd\u8d85\u8fc7 ${MAX_BRANDS} \u9879`);
    const now = new Date().toISOString();
    const brand: HomeBrand = {
      id: `brand-${randomUUID()}`,
      ...clean,
      createdAt: now,
      updatedAt: now,
    };
    content.brands.push(brand);
    return brand;
  });
}

export function updateBrand(id: string, input: unknown) {
  const cleanId = parseId(id, "id");
  const clean = parseBrandInput(input);
  return mutateHomeContent((content) => {
    const index = content.brands.findIndex((brand) => brand.id === cleanId);
    if (index < 0) fail("\u5408\u4f5c\u54c1\u724c\u4e0d\u5b58\u5728");
    const current = content.brands[index];
    const brand: HomeBrand = {
      id: current.id,
      ...clean,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    content.brands[index] = brand;
    return brand;
  });
}

export function deleteBrand(id: string) {
  const cleanId = parseId(id, "id");
  return mutateHomeContent((content) => {
    const index = content.brands.findIndex((brand) => brand.id === cleanId);
    if (index < 0) fail("\u5408\u4f5c\u54c1\u724c\u4e0d\u5b58\u5728");
    content.brands.splice(index, 1);
  });
}

export function reorderBrands(ids: unknown) {
  return mutateHomeContent((content) => {
    const order = parseOrder(ids, content.brands.map((brand) => brand.id), "ids");
    const byId = new Map(content.brands.map((brand) => [brand.id, brand]));
    content.brands = order.map((id) => byId.get(id) as HomeBrand);
    return content.brands;
  });
}

export function updateService(id: string, input: unknown) {
  const cleanId = parseId(id, "id");
  const clean = parseServiceInput(input);
  return mutateHomeContent((content) => {
    const index = content.services.findIndex((service) => service.id === cleanId);
    if (index < 0) fail("\u670d\u52a1\u4e0d\u5b58\u5728");
    const current = content.services[index];
    if (current.slug !== clean.slug) fail("\u5bfc\u822a\u670d\u52a1 slug \u4e0d\u53ef\u4fee\u6539");
    const service: HomeService = {
      id: current.id,
      ...clean,
      ...(clean.seoDescription === undefined && current.seoDescription ? { seoDescription: current.seoDescription } : {}),
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    content.services[index] = service;
    return service;
  });
}

export function createService(input: unknown) {
  const clean = parseServiceInput(input);
  return mutateHomeContent((content) => {
    if (content.services.length >= MAX_SERVICES) fail(`\u670d\u52a1\u4e0d\u80fd\u8d85\u8fc7 ${MAX_SERVICES} \u9879`);
    if (content.services.some((service) => service.slug === clean.slug)) fail("\u670d\u52a1 slug \u5df2\u5b58\u5728");
    const now = new Date().toISOString();
    const service: HomeService = {
      id: `service-${randomUUID()}`,
      ...clean,
      createdAt: now,
      updatedAt: now,
    };
    content.services.push(service);
    return service;
  });
}

export function deleteService(id: string) {
  const cleanId = parseId(id, "id");
  return mutateHomeContent((content) => {
    const index = content.services.findIndex((service) => service.id === cleanId);
    if (index < 0) fail("\u670d\u52a1\u4e0d\u5b58\u5728");
    content.services.splice(index, 1);
  });
}

export function reorderServices(ids: unknown) {
  return mutateHomeContent((content) => {
    const order = parseOrder(ids, content.services.map((service) => service.id), "ids");
    const byId = new Map(content.services.map((service) => [service.id, service]));
    content.services = order.map((id) => byId.get(id) as HomeService);
    return content.services;
  });
}

export function updateHomeCaseSlugs(slugs: unknown) {
  const clean = parseHomeCaseSlugs(slugs, "slugs");
  return mutateHomeContent((content) => {
    content.homeCaseSlugs = clean;
    return content.homeCaseSlugs;
  });
}

export function replaceHomeCaseSlug(currentSlug: string, nextSlug: string) {
  const current = parseSlug(currentSlug, "currentSlug");
  const next = parseSlug(nextSlug, "nextSlug");
  return mutateHomeContent((content) => {
    const slugs = content.homeCaseSlugs.map((slug) => slug === current ? next : slug);
    content.homeCaseSlugs = parseHomeCaseSlugs(slugs);
    return content.homeCaseSlugs;
  });
}

export function removeHomeCaseSlug(slug: string) {
  const clean = parseSlug(slug, "slug");
  return mutateHomeContent((content) => {
    content.homeCaseSlugs = content.homeCaseSlugs.filter((item) => item !== clean);
    return content.homeCaseSlugs;
  });
}
