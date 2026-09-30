import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import bundledHeroVideos from "@/data/hero-videos.json";
import type { HeroVideo, HeroVideoInput } from "@/types/hero-video";

const HERO_VIDEOS_FILE = path.join(process.cwd(), "data", "hero-videos.json");
const MAX_VIDEOS = 100;
const inputKeys = ["name", "src", "poster", "enabled"] as const;

export class HeroVideoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HeroVideoValidationError";
  }
}

function fail(message: string): never {
  throw new HeroVideoValidationError(message);
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

function parseOptionalText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string") fail(`${label}\u5fc5\u987b\u662f\u5b57\u7b26\u4e32`);
  const clean = value.trim();
  if (clean.length > maxLength) fail(`${label}\u4e0d\u80fd\u8d85\u8fc7 ${maxLength} \u4e2a\u5b57\u7b26`);
  return clean;
}

function parseId(value: unknown, label: string) {
  const id = parseText(value, label, 100);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail(`${label}\u683c\u5f0f\u65e0\u6548`);
  return id;
}

function parseName(value: unknown, label: string): HeroVideo["name"] {
  const record = asRecord(value, label);
  assertExactKeys(record, ["zh", "en"], label);
  return {
    zh: parseText(record.zh, `${label}.zh`, 120),
    en: parseOptionalText(record.en, `${label}.en`, 120),
  };
}

function parseBoolean(value: unknown, label: string) {
  if (typeof value !== "boolean") fail(`${label}\u5fc5\u987b\u662f\u5e03\u5c14\u503c`);
  return value;
}

function parseLocalPath(
  value: unknown,
  label: string,
  roots: readonly string[],
  extensions: readonly string[],
) {
  const localPath = parseText(value, label, 500);
  const normalized = localPath.toLowerCase();
  if (
    !roots.some((root) => localPath.startsWith(root))
    || localPath.includes("..")
    || localPath.includes("\\")
    || localPath.includes("//")
    || localPath.includes("?")
    || localPath.includes("#")
    || localPath.includes("%")
    || !extensions.some((extension) => normalized.endsWith(extension))
  ) {
    fail(`${label}\u5fc5\u987b\u662f\u5141\u8bb8\u76ee\u5f55\u4e0b\u7684\u7ad9\u5185\u5a92\u4f53\u8def\u5f84`);
  }
  return localPath;
}

function parseSource(value: unknown, label: string) {
  return parseLocalPath(
    value,
    label,
    ["/"],
    [".mp4", ".webm", ".mov"],
  );
}

function parsePoster(value: unknown, label: string) {
  if (value === undefined || value === "") return undefined;
  return parseLocalPath(
    value,
    label,
    ["/"],
    [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"],
  );
}

function parseTimestamp(value: unknown, label: string) {
  const timestamp = parseText(value, label, 40);
  if (!Number.isFinite(Date.parse(timestamp))) fail(`${label}\u5fc5\u987b\u662f\u6709\u6548\u65f6\u95f4`);
  return timestamp;
}

function parseInputFields(record: Record<string, unknown>, label: string): HeroVideoInput {
  const poster = parsePoster(record.poster, `${label}.poster`);
  return {
    name: parseName(record.name, `${label}.name`),
    src: parseSource(record.src, `${label}.src`),
    ...(poster ? { poster } : {}),
    enabled: parseBoolean(record.enabled, `${label}.enabled`),
  };
}

function parseHeroVideoInput(value: unknown, label = "video"): HeroVideoInput {
  const record = asRecord(value, label);
  assertExactKeys(record, inputKeys, label);
  return parseInputFields(record, label);
}

function parseHeroVideo(value: unknown, label: string): HeroVideo {
  const record = asRecord(value, label);
  assertExactKeys(record, ["id", ...inputKeys, "createdAt", "updatedAt"], label);
  return {
    id: parseId(record.id, `${label}.id`),
    ...parseInputFields(record, label),
    createdAt: parseTimestamp(record.createdAt, `${label}.createdAt`),
    updatedAt: parseTimestamp(record.updatedAt, `${label}.updatedAt`),
  };
}

function parseHeroVideos(value: unknown) {
  if (!Array.isArray(value)) fail("heroVideos\u5fc5\u987b\u662f\u6570\u7ec4");
  if (value.length > MAX_VIDEOS) fail(`heroVideos\u4e0d\u80fd\u8d85\u8fc7 ${MAX_VIDEOS} \u9879`);
  const videos = value.map((video, index) => parseHeroVideo(video, `heroVideos[${index}]`));
  const ids = videos.map((video) => video.id);
  const sources = videos.map((video) => video.src);
  if (new Set(ids).size !== ids.length) fail("heroVideos.id\u4e0d\u80fd\u91cd\u590d");
  if (new Set(sources).size !== sources.length) fail("heroVideos.src\u4e0d\u80fd\u91cd\u590d");
  return videos;
}

async function readHeroVideosFile() {
  let raw: string;
  try {
    raw = await fs.readFile(HERO_VIDEOS_FILE, "utf8");
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
    await initializeHeroVideosFile();
    raw = await fs.readFile(HERO_VIDEOS_FILE, "utf8");
  }
  return parseHeroVideos(JSON.parse(raw));
}

async function initializeHeroVideosFile() {
  const clean = parseHeroVideos(bundledHeroVideos as unknown);
  const temporaryFile = `${HERO_VIDEOS_FILE}.${process.pid}.${randomUUID()}.init`;
  await fs.mkdir(path.dirname(HERO_VIDEOS_FILE), { recursive: true });
  try {
    await fs.writeFile(temporaryFile, `${JSON.stringify(clean, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    try {
      await fs.link(temporaryFile, HERO_VIDEOS_FILE);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EEXIST") throw error;
    }
  } finally {
    await fs.rm(temporaryFile, { force: true }).catch(() => undefined);
  }
}

async function writeHeroVideosFile(videos: HeroVideo[]) {
  const clean = parseHeroVideos(videos);
  const temporaryFile = `${HERO_VIDEOS_FILE}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryFile, `${JSON.stringify(clean, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
    });
    await fs.rename(temporaryFile, HERO_VIDEOS_FILE);
  } finally {
    await fs.rm(temporaryFile, { force: true }).catch(() => undefined);
  }
}

let writeQueue: Promise<void> = Promise.resolve();

function mutateHeroVideos<T>(mutator: (videos: HeroVideo[]) => T | Promise<T>): Promise<T> {
  const operation = writeQueue.then(async () => {
    const videos = await readHeroVideosFile();
    const result = await mutator(videos);
    await writeHeroVideosFile(videos);
    return result;
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

function parseOrder(value: unknown, existingIds: string[]) {
  if (!Array.isArray(value)) fail("ids\u5fc5\u987b\u662f\u6570\u7ec4");
  const ids = value.map((id, index) => parseId(id, `ids[${index}]`));
  if (new Set(ids).size !== ids.length) fail("ids\u4e0d\u80fd\u5305\u542b\u91cd\u590d\u9879");
  if (ids.length !== existingIds.length || ids.some((id) => !existingIds.includes(id))) {
    fail("ids\u5fc5\u987b\u5305\u542b\u5168\u90e8\u73b0\u6709\u89c6\u9891 ID");
  }
  return ids;
}

export async function getHeroVideos() {
  noStore();
  await writeQueue;
  return readHeroVideosFile();
}

export function createHeroVideo(input: unknown) {
  const clean = parseHeroVideoInput(input);
  return mutateHeroVideos((videos) => {
    if (videos.length >= MAX_VIDEOS) fail(`\u9996\u9875\u80cc\u666f\u89c6\u9891\u4e0d\u80fd\u8d85\u8fc7 ${MAX_VIDEOS} \u6761`);
    if (videos.some((video) => video.src === clean.src)) fail("\u8be5\u89c6\u9891\u8def\u5f84\u5df2\u5b58\u5728");
    const now = new Date().toISOString();
    const video: HeroVideo = {
      id: `video-${randomUUID()}`,
      ...clean,
      createdAt: now,
      updatedAt: now,
    };
    videos.push(video);
    return video;
  });
}

export function updateHeroVideo(id: string, input: unknown) {
  const cleanId = parseId(id, "id");
  const clean = parseHeroVideoInput(input);
  return mutateHeroVideos((videos) => {
    const index = videos.findIndex((video) => video.id === cleanId);
    if (index < 0) fail("\u9996\u9875\u80cc\u666f\u89c6\u9891\u4e0d\u5b58\u5728");
    if (videos.some((video, itemIndex) => itemIndex !== index && video.src === clean.src)) {
      fail("\u8be5\u89c6\u9891\u8def\u5f84\u5df2\u5b58\u5728");
    }
    const current = videos[index];
    const video: HeroVideo = {
      id: current.id,
      ...clean,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    videos[index] = video;
    return video;
  });
}

export function deleteHeroVideo(id: string) {
  const cleanId = parseId(id, "id");
  return mutateHeroVideos((videos) => {
    const index = videos.findIndex((video) => video.id === cleanId);
    if (index < 0) fail("\u9996\u9875\u80cc\u666f\u89c6\u9891\u4e0d\u5b58\u5728");
    // Intentionally delete only the content record. Physical media is managed separately.
    videos.splice(index, 1);
  });
}

export function reorderHeroVideos(ids: unknown) {
  return mutateHeroVideos((videos) => {
    const order = parseOrder(ids, videos.map((video) => video.id));
    const byId = new Map(videos.map((video) => [video.id, video]));
    videos.splice(0, videos.length, ...order.map((id) => byId.get(id) as HeroVideo));
    return videos;
  });
}
