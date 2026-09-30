import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import type { CaseHomeMedia, CaseInput, CaseStudy } from "@/types/case";

const CASES_FILE = path.join(process.cwd(), "data", "cases.json");
let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function normalizeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) throw new Error("链接标识只能包含小写字母、数字和连字符");
  return slug;
}

function cleanImagePath(value: string, label: string, required = false) {
  if (typeof value !== "string") throw new Error(`${label}必须是字符串`);
  const imagePath = value.trim();
  if (!imagePath) {
    if (required) throw new Error(`${label}为必填项`);
    return "";
  }
  if (
    !imagePath.startsWith("/")
    || imagePath.startsWith("//")
    || imagePath.length > 500
    || imagePath.includes("..")
    || imagePath.includes("\\")
    || imagePath.includes("//")
    || imagePath.includes("?")
    || imagePath.includes("#")
    || imagePath.includes("%")
    || /[\u0000-\u001f\u007f]/.test(imagePath)
    || !/\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(imagePath)
  ) {
    throw new Error(`${label}必须是公共文件库中的站内图片`);
  }
  return imagePath;
}

function cleanVideoPath(value: string, label: string) {
  if (typeof value !== "string") throw new Error(`${label}必须是字符串`);
  const videoPath = value.trim();
  if (
    !videoPath.startsWith("/")
    || videoPath.startsWith("//")
    || videoPath.length > 500
    || videoPath.includes("..")
    || videoPath.includes("\\")
    || videoPath.includes("//")
    || videoPath.includes("?")
    || videoPath.includes("#")
    || videoPath.includes("%")
    || /[\u0000-\u001f\u007f]/.test(videoPath)
    || !/\.(?:m4v|mov|mp4|ogv|webm)$/i.test(videoPath)
  ) {
    throw new Error(`${label}必须是公共文件库中的站内视频`);
  }
  return videoPath;
}

function cleanHomeMedia(value: CaseInput["homeMedia"]): CaseHomeMedia | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("首页案例媒体格式无效");
  }
  const keys = Object.keys(value);
  if (value.type === "image") {
    if (keys.some((key) => key !== "type" && key !== "src")) {
      throw new Error("首页案例图片包含不支持的字段");
    }
    return { type: "image", src: cleanImagePath(value.src, "首页案例图片", true) };
  }
  if (value.type === "video") {
    if (keys.some((key) => key !== "type" && key !== "src" && key !== "poster" && key !== "autoPlay")) {
      throw new Error("首页案例视频包含不支持的字段");
    }
    if (value.autoPlay !== undefined && typeof value.autoPlay !== "boolean") {
      throw new Error("首页案例视频自动播放状态必须是布尔值");
    }
    const poster = value.poster ? cleanImagePath(value.poster, "首页案例视频海报") : "";
    return {
      type: "video",
      src: cleanVideoPath(value.src, "首页案例视频"),
      ...(poster ? { poster } : {}),
      ...(value.autoPlay ? { autoPlay: true } : {}),
    };
  }
  throw new Error("首页案例媒体必须是图片或视频");
}

function cleanInput(input: CaseInput): CaseInput {
  const slug = normalizeSlug(input.slug || input.title);
  if (!slug || !input.title.trim() || !input.category.trim() || !input.coverImage.trim()) {
    throw new Error("标题、分类、链接标识和封面图为必填项");
  }

  if (typeof input.featured !== "boolean" || typeof input.published !== "boolean") {
    throw new Error("精选和发布状态必须是布尔值");
  }
  if (input.isSample !== undefined && typeof input.isSample !== "boolean") {
    throw new Error("概念样片状态必须是布尔值");
  }

  return {
    slug,
    title: input.title.trim(),
    category: input.category.trim(),
    summary: input.summary.trim(),
    client: input.client.trim(),
    year: input.year.trim(),
    services: input.services.map((item) => item.trim()).filter(Boolean),
    coverImage: cleanImagePath(input.coverImage, "封面图", true),
    coverAlt: input.coverAlt.trim() || `${input.title.trim()}案例封面`,
    homeMedia: cleanHomeMedia(input.homeMedia),
    gallery: input.gallery.map((item) => cleanImagePath(item, "画廊图片")).filter(Boolean),
    sections: input.sections
      .map((section) => ({
        heading: section.heading.trim(),
        body: section.body.trim(),
        image: section.image ? cleanImagePath(section.image, "段落图片") || undefined : undefined,
        imageAlt: section.imageAlt?.trim() || undefined,
      }))
      .filter((section) => section.heading || section.body),
    featured: input.featured,
    isSample: input.isSample ?? false,
    published: input.published,
  };
}

async function readAll(): Promise<CaseStudy[]> {
  const raw = await fs.readFile(CASES_FILE, "utf8");
  // 兼容尚未迁移的持久化数据；显式填写后始终以字段为准。
  return (JSON.parse(raw) as CaseStudy[]).map((item) => ({
    ...item,
    isSample: typeof item.isSample === "boolean" ? item.isSample : item.slug.startsWith("ad-sample-"),
  }));
}

async function writeAll(cases: CaseStudy[]) {
  const temporaryFile = path.join(
    path.dirname(CASES_FILE),
    `.${path.basename(CASES_FILE)}.${process.pid}.${randomUUID()}.tmp`,
  );

  try {
    await fs.writeFile(temporaryFile, `${JSON.stringify(cases, null, 2)}\n`, "utf8");
    await fs.rename(temporaryFile, CASES_FILE);
  } catch (error) {
    await fs.rm(temporaryFile, { force: true }).catch(() => undefined);
    throw error;
  }
}

export async function getCases(options: { includeDrafts?: boolean } = {}) {
  noStore();
  const cases = await readAll();
  return cases.filter((item) => options.includeDrafts || item.published);
}

export async function getCase(slug: string, options: { includeDrafts?: boolean } = {}) {
  const cases = await getCases(options);
  return cases.find((item) => item.slug === slug) ?? null;
}

export async function createCase(input: CaseInput) {
  return enqueueWrite(async () => {
    const cases = await readAll();
    const clean = cleanInput(input);
    if (cases.some((item) => item.slug === clean.slug)) {
      throw new Error("该链接标识已存在");
    }
    const now = new Date().toISOString();
    const created: CaseStudy = { ...clean, createdAt: now, updatedAt: now };
    await writeAll([created, ...cases]);
    return created;
  });
}

export async function updateCase(currentSlug: string, input: CaseInput) {
  return enqueueWrite(async () => {
    const cases = await readAll();
    const index = cases.findIndex((item) => item.slug === currentSlug);
    if (index < 0) throw new Error("案例不存在");

    const clean = cleanInput({ ...input, isSample: input.isSample === undefined ? cases[index].isSample : input.isSample });
    if (cases.some((item, itemIndex) => item.slug === clean.slug && itemIndex !== index)) {
      throw new Error("该链接标识已存在");
    }

    const updated: CaseStudy = {
      ...clean,
      createdAt: cases[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    cases[index] = updated;
    await writeAll(cases);
    return updated;
  });
}

export async function deleteCase(slug: string) {
  return enqueueWrite(async () => {
    const cases = await readAll();
    const next = cases.filter((item) => item.slug !== slug);
    if (next.length === cases.length) throw new Error("案例不存在");
    await writeAll(next);
  });
}

export async function reorderCases(slugs: unknown) {
  if (!Array.isArray(slugs) || !slugs.every((slug) => typeof slug === "string")) {
    throw new Error("案例顺序必须是链接标识数组");
  }
  if (new Set(slugs).size !== slugs.length) {
    throw new Error("案例顺序不能包含重复项");
  }

  return enqueueWrite(async () => {
    const cases = await readAll();
    const existingSlugs = cases.map((item) => item.slug);
    if (slugs.length !== existingSlugs.length || slugs.some((slug) => !existingSlugs.includes(slug))) {
      throw new Error("案例顺序必须包含全部现有案例");
    }

    const casesBySlug = new Map(cases.map((item) => [item.slug, item]));
    const reordered = slugs.map((slug) => casesBySlug.get(slug) as CaseStudy);
    await writeAll(reordered);
    return reordered;
  });
}
