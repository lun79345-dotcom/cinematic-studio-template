import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type {
  PublicAsset,
  PublicAssetKind,
  PublicDirectoryListing,
} from "@/types/public-file";

const PUBLIC_ROOT = path.resolve(process.cwd(), "public");
const UPLOADS_ROOT = path.join(PUBLIC_ROOT, "uploads");
const DATA_ROOT = path.resolve(process.cwd(), "data");

export const MAX_PUBLIC_UPLOAD_BYTES = 120 * 1024 * 1024;

const imageMimeByExtension: Record<string, string> = {
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

const videoMimeByExtension: Record<string, string> = {
  m4v: "video/mp4",
  mov: "video/quicktime",
  mp4: "video/mp4",
  ogv: "video/ogg",
  webm: "video/webm",
};

const reservedWindowsName = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

type UploadKind = "image" | "video";

type DetectedUpload = {
  kind: UploadKind;
  extension: "avif" | "gif" | "jpg" | "png" | "webp" | "mov" | "mp4" | "webm";
  mime: string;
};

export class PublicFileError extends Error {
  status: number;
  usages?: string[];

  constructor(message: string, status = 400, usages?: string[]) {
    super(message);
    this.name = "PublicFileError";
    this.status = status;
    this.usages = usages;
  }
}

function fail(message: string, status = 400, usages?: string[]): never {
  throw new PublicFileError(message, status, usages);
}

function extensionOf(filename: string) {
  return path.extname(filename).slice(1).toLowerCase();
}

function kindAndMime(filename: string): { kind: PublicAssetKind; mime: string | null } {
  const extension = extensionOf(filename);
  if (imageMimeByExtension[extension]) {
    return { kind: "image", mime: imageMimeByExtension[extension] };
  }
  if (videoMimeByExtension[extension]) {
    return { kind: "video", mime: videoMimeByExtension[extension] };
  }
  return { kind: "other", mime: null };
}

function validateSegment(segment: string, label: string) {
  if (
    !segment
    || segment === "."
    || segment === ".."
    || segment.length > 220
    || /[\u0000-\u001f<>:"|?*\\/#%]/.test(segment)
    || /[. ]$/.test(segment)
    || reservedWindowsName.test(segment)
  ) {
    fail(`${label}包含不安全或不受支持的名称`);
  }
  return segment;
}

export function normalizePublicRelativePath(value: unknown, options: { allowRoot?: boolean } = {}) {
  if (typeof value !== "string") fail("路径必须是字符串");
  const candidate = value.trim();
  if (!candidate) {
    if (options.allowRoot) return "";
    fail("路径不能为空");
  }
  if (
    candidate.length > 1200
    || candidate.startsWith("/")
    || candidate.startsWith("\\")
    || /^[a-z]:/i.test(candidate)
    || candidate.includes("\\")
    || candidate.includes("//")
    || candidate.includes("\0")
    || candidate.includes("?")
    || candidate.includes("#")
    || candidate.includes("%")
  ) {
    fail("路径格式无效");
  }
  const segments = candidate.split("/").map((segment) => validateSegment(segment, "路径"));
  return segments.join("/");
}

export function normalizePublicName(value: unknown, label = "名称") {
  if (typeof value !== "string") fail(`${label}必须是字符串`);
  return validateSegment(value.trim().normalize("NFKC"), label);
}

function absoluteFromRelative(relativePath: string) {
  const target = path.resolve(PUBLIC_ROOT, ...relativePath.split("/").filter(Boolean));
  const relative = path.relative(PUBLIC_ROOT, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) fail("路径超出 public 目录", 403);
  return target;
}

function isWritableDirectory(relativePath: string) {
  return relativePath === "uploads" || relativePath.startsWith("uploads/");
}

function isWritableItem(relativePath: string) {
  return relativePath.startsWith("uploads/");
}

function assertWritableDirectory(relativePath: string) {
  if (!isWritableDirectory(relativePath)) fail("内置站点素材为只读，请在 uploads 文件夹中操作", 403);
}

function assertWritableItem(relativePath: string) {
  if (!isWritableItem(relativePath)) fail("该文件或文件夹不可修改", 403);
}

async function ensureUploadsRoot() {
  await fs.mkdir(UPLOADS_ROOT, { recursive: true });
}

async function assertNoSymlinks(relativePath: string, allowMissingLeaf = false) {
  const publicRootStats = await fs.lstat(PUBLIC_ROOT);
  if (publicRootStats.isSymbolicLink()) fail("public 根目录不能是符号链接或目录联接", 403);
  const segments = relativePath.split("/").filter(Boolean);
  let current = PUBLIC_ROOT;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    try {
      const stats = await fs.lstat(current);
      if (stats.isSymbolicLink()) fail("不允许访问符号链接或目录联接", 403);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT" && allowMissingLeaf && index === segments.length - 1) {
        return;
      }
      throw error;
    }
  }
}

function publicUrl(relativePath: string) {
  // Store the human-readable site path. Browsers encode unicode and spaces when
  // requesting it, while content validation and reference checks keep one form.
  return `/${relativePath}`;
}

async function assetFromEntry(parent: string, entry: { name: string; isDirectory(): boolean; isFile(): boolean; isSymbolicLink(): boolean }) {
  if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile())) return null;
  const relativePath = parent ? `${parent}/${entry.name}` : entry.name;
  const absolutePath = absoluteFromRelative(relativePath);
  const stats = await fs.stat(absolutePath);
  const type = entry.isDirectory() ? "directory" as const : "file" as const;
  const media = type === "file" ? kindAndMime(entry.name) : { kind: "other" as const, mime: null };
  const writable = isWritableItem(relativePath);
  const asset: PublicAsset = {
    name: entry.name,
    path: relativePath,
    type,
    kind: media.kind,
    url: type === "file" ? publicUrl(relativePath) : "",
    mime: media.mime,
    mimeType: media.mime,
    size: type === "file" ? stats.size : null,
    modifiedAt: stats.mtime.toISOString(),
    writable,
    readOnly: !writable,
  };
  return asset;
}

export async function listPublicDirectory(inputPath: unknown): Promise<PublicDirectoryListing> {
  await ensureUploadsRoot();
  const relativePath = normalizePublicRelativePath(inputPath, { allowRoot: true });
  await assertNoSymlinks(relativePath);
  const absolutePath = absoluteFromRelative(relativePath);
  let stats;
  try {
    stats = await fs.stat(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") fail("文件夹不存在", 404);
    throw error;
  }
  if (!stats.isDirectory()) fail("所选路径不是文件夹");

  const entries = await fs.readdir(absolutePath, { withFileTypes: true });
  const items = (await Promise.all(entries.map((entry) => assetFromEntry(relativePath, entry))))
    .filter((item): item is PublicAsset => Boolean(item))
    .sort((left, right) => {
      if (left.type !== right.type) return left.type === "directory" ? -1 : 1;
      return left.name.localeCompare(right.name, "zh-CN", { numeric: true, sensitivity: "base" });
    });
  const writable = isWritableDirectory(relativePath);
  const segments = relativePath.split("/").filter(Boolean);
  return {
    path: relativePath,
    parent: segments.length ? segments.slice(0, -1).join("/") : null,
    writable,
    readOnly: !writable,
    items,
  };
}

export async function createPublicFolder(inputPath: unknown, inputName: unknown) {
  await ensureUploadsRoot();
  const parent = normalizePublicRelativePath(inputPath, { allowRoot: true });
  const name = normalizePublicName(inputName, "文件夹名称");
  assertWritableDirectory(parent);
  await assertNoSymlinks(parent);
  const targetRelative = parent ? `${parent}/${name}` : name;
  const target = absoluteFromRelative(targetRelative);
  try {
    await fs.mkdir(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") fail("同名文件或文件夹已存在", 409);
    throw error;
  }
  return targetRelative;
}

function startsWithAscii(buffer: Buffer, values: number[]) {
  return values.every((value, index) => buffer[index] === value);
}

function detectUpload(buffer: Buffer): DetectedUpload {
  if (buffer.length < 12) fail("文件内容无效或已损坏");
  if (startsWithAscii(buffer, [0xff, 0xd8, 0xff])) return { kind: "image", extension: "jpg", mime: "image/jpeg" };
  if (startsWithAscii(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { kind: "image", extension: "png", mime: "image/png" };
  }
  const signature = buffer.subarray(0, 12).toString("ascii");
  if (signature.startsWith("GIF87a") || signature.startsWith("GIF89a")) {
    return { kind: "image", extension: "gif", mime: "image/gif" };
  }
  if (signature.startsWith("RIFF") && signature.slice(8, 12) === "WEBP") {
    return { kind: "image", extension: "webp", mime: "image/webp" };
  }
  if (startsWithAscii(buffer, [0x1a, 0x45, 0xdf, 0xa3])) {
    const header = buffer.subarray(0, Math.min(buffer.length, 4096));
    const webmDocType = Buffer.from([0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d]);
    if (header.indexOf(webmDocType) !== -1) {
      return { kind: "video", extension: "webm", mime: "video/webm" };
    }
    fail("该 EBML 文件不是受支持的 WebM 视频");
  }
  if (signature.slice(4, 8) === "ftyp") {
    const declaredBoxSize = buffer.readUInt32BE(0);
    const ftypEnd = Math.min(buffer.length, Math.max(16, Math.min(declaredBoxSize, 512)));
    const brands: string[] = [];
    for (let offset = 8; offset + 4 <= ftypEnd; offset += 4) {
      // Offset 12 is the minor version, not a compatible brand.
      if (offset !== 12) brands.push(buffer.subarray(offset, offset + 4).toString("ascii").toLowerCase());
    }
    const majorBrand = brands[0] ?? "";
    if (brands.some((brand) => brand === "avif" || brand === "avis")) {
      return { kind: "image", extension: "avif", mime: "image/avif" };
    }
    const quickTimeBrands = new Set(["qt  ", "mqt "]);
    const containsVideoTrack = buffer.indexOf(Buffer.from("vide", "ascii")) !== -1;
    if (quickTimeBrands.has(majorBrand) && containsVideoTrack) {
      return { kind: "video", extension: "mov", mime: "video/quicktime" };
    }
    const mp4ContainerBrands = new Set([
      "avc1", "dash", "iso2", "iso3", "iso4", "iso5", "iso6", "isom",
      "m4v ", "mp41", "mp42", "msnv",
    ]);
    if (mp4ContainerBrands.has(majorBrand) && containsVideoTrack) {
      return { kind: "video", extension: "mp4", mime: "video/mp4" };
    }
    fail("该 ISO 媒体文件不是受支持的 MP4、MOV 或 AVIF 文件");
  }
  fail("无法识别文件内容；仅支持 JPG、PNG、WebP、GIF、AVIF、MP4、WebM 或 MOV");
}

function safeUploadStem(filename: string) {
  const withoutExtension = path.parse(filename).name.normalize("NFKC").trim();
  const clean = withoutExtension
    .replace(/[\u0000-\u001f<>:"|?*\\/#%]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[. -]+|[. -]+$/g, "")
    .slice(0, 80);
  if (!clean || reservedWindowsName.test(clean)) return "asset";
  return clean;
}

async function normalizeLogo(buffer: Buffer) {
  const input = sharp(buffer, { failOn: "error", limitInputPixels: 80_000_000 }).rotate();
  const metadata = await input.metadata();
  if (!metadata.width || !metadata.height || metadata.width > 20_000 || metadata.height > 20_000) {
    fail("Logo 图片尺寸无效或过大");
  }
  const trimmed = await input
    .trim()
    .png()
    .toBuffer();
  const normalized = await sharp(trimmed)
    .resize({ width: 440, height: 200, fit: "inside", withoutEnlargement: false })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  return sharp({
    create: {
      width: 480,
      height: 240,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: normalized, gravity: "center" }])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

export async function normalizePublicLogo(inputPath: unknown) {
  await ensureUploadsRoot();
  const sourceRelative = normalizePublicRelativePath(
    typeof inputPath === "string" ? inputPath.replace(/^\/+/, "") : inputPath,
  );
  await assertNoSymlinks(sourceRelative);
  const sourceAbsolute = absoluteFromRelative(sourceRelative);
  const sourceStats = await fs.stat(sourceAbsolute).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") fail("所选 Logo 图片不存在", 404);
    throw error;
  });
  if (!sourceStats.isFile() || kindAndMime(sourceRelative).kind !== "image") {
    fail("所选 Logo 必须是公共文件库中的图片");
  }
  if (sourceStats.size > 20 * 1024 * 1024) fail("Logo 图片不能超过 20MB", 413);
  if (sourceRelative.startsWith("uploads/brands/") && /-logo-480x240\.png$/i.test(sourceRelative)) {
    return publicUrl(sourceRelative);
  }

  const sourceBuffer = await fs.readFile(sourceAbsolute);
  let normalized: Buffer;
  try {
    normalized = await normalizeLogo(sourceBuffer);
  } catch (error) {
    if (error instanceof PublicFileError) throw error;
    fail("Logo 图片无法解析，请换用有效的 JPG、PNG、WebP、GIF 或 AVIF");
  }
  const destinationDirectory = "uploads/brands";
  await fs.mkdir(absoluteFromRelative(destinationDirectory), { recursive: true });
  await assertNoSymlinks(destinationDirectory);
  const filename = `${safeUploadStem(path.parse(sourceRelative).name)}-logo-480x240.png`;
  const destinationRelative = `${destinationDirectory}/${filename}`;
  const destinationAbsolute = absoluteFromRelative(destinationRelative);
  await fs.writeFile(destinationAbsolute, normalized);
  return publicUrl(destinationRelative);
}

export async function uploadPublicFile(
  file: File,
  inputPath: unknown,
  purpose?: unknown,
) {
  await ensureUploadsRoot();
  const directory = normalizePublicRelativePath(inputPath, { allowRoot: true });
  assertWritableDirectory(directory);
  await assertNoSymlinks(directory);
  const directoryAbsolute = absoluteFromRelative(directory);
  const directoryStats = await fs.stat(directoryAbsolute).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") fail("上传文件夹不存在", 404);
    throw error;
  });
  if (!directoryStats.isDirectory()) fail("上传路径不是文件夹");
  if (!file.name || file.size <= 0) fail("请选择有效文件");
  if (file.size > MAX_PUBLIC_UPLOAD_BYTES) fail("文件不能超过 120MB", 413);

  let buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectUpload(buffer);
  const sourceExtension = extensionOf(file.name);
  const compatibleExtensions: Record<DetectedUpload["extension"], Set<string>> = {
    avif: new Set(["avif"]),
    gif: new Set(["gif"]),
    jpg: new Set(["jpeg", "jpg"]),
    mov: new Set(["mov"]),
    mp4: new Set(["m4v", "mp4"]),
    png: new Set(["png"]),
    webm: new Set(["webm"]),
    webp: new Set(["webp"]),
  };
  if (!compatibleExtensions[detected.extension].has(sourceExtension)) {
    fail("文件扩展名与实际内容类型不一致");
  }
  if (detected.kind === "image" && file.size > 20 * 1024 * 1024) fail("图片不能超过 20MB", 413);
  if (purpose !== undefined && purpose !== "" && purpose !== "logo" && purpose !== "image") {
    fail("不支持的上传用途");
  }
  if (purpose === "image" && detected.kind !== "image") fail("请选择图片文件");

  let extension = detected.extension;
  if (purpose === "logo") {
    if (detected.kind !== "image") fail("品牌 Logo 必须是图片");
    try {
      buffer = await normalizeLogo(buffer);
    } catch (error) {
      if (error instanceof PublicFileError) throw error;
      fail("Logo 图片无法解析，请换用有效的 JPG、PNG、WebP、GIF 或 AVIF");
    }
    extension = "png";
  }

  const filename = `${safeUploadStem(file.name)}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const relativePath = directory ? `${directory}/${filename}` : filename;
  const absolutePath = absoluteFromRelative(relativePath);
  await assertNoSymlinks(relativePath, true);
  await fs.writeFile(absolutePath, buffer, { flag: "wx" });
  const listing = await listPublicDirectory(directory);
  const asset = listing.items.find((item) => item.path === relativePath);
  if (!asset) fail("文件已写入但无法读取", 500);
  return asset;
}

function normalizeStoredReference(value: string) {
  let reference = value.trim();
  try {
    reference = decodeURIComponent(reference);
  } catch {
    // Keep malformed values unchanged; they cannot equal a managed path safely.
  }
  return reference.replace(/\\/g, "/").replace(/^\/+/, "");
}

function collectReferences(
  value: unknown,
  target: string,
  source: string,
  location: string,
  usages: string[],
) {
  if (typeof value === "string") {
    const reference = normalizeStoredReference(value);
    const referenceForComparison = process.platform === "win32" ? reference.toLowerCase() : reference;
    const targetForComparison = process.platform === "win32" ? target.toLowerCase() : target;
    if (referenceForComparison === targetForComparison || referenceForComparison.startsWith(`${targetForComparison}/`)) {
      usages.push(`${source}${location ? ` · ${location}` : ""}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectReferences(item, target, source, `${location}[${index}]`, usages));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      collectReferences(item, target, source, location ? `${location}.${key}` : key, usages);
    });
  }
}

export async function findPublicAssetUsages(relativePath: string) {
  const usages: string[] = [];
  let entries: string[] = [];
  try {
    entries = (await fs.readdir(DATA_ROOT)).filter((name) => name.toLowerCase().endsWith(".json"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await Promise.all(entries.map(async (filename) => {
    try {
      const raw = await fs.readFile(path.join(DATA_ROOT, filename), "utf8");
      collectReferences(JSON.parse(raw), relativePath, filename, "", usages);
    } catch (error) {
      if (error instanceof SyntaxError) {
        fail(`无法确认素材引用：${filename} 不是有效 JSON，请先修复数据文件`, 409);
      }
      throw error;
    }
  }));
  return Array.from(new Set(usages)).sort((left, right) => left.localeCompare(right, "zh-CN"));
}

async function checkedWritableItem(inputPath: unknown) {
  const relativePath = normalizePublicRelativePath(inputPath);
  assertWritableItem(relativePath);
  await assertNoSymlinks(relativePath);
  const absolutePath = absoluteFromRelative(relativePath);
  let stats;
  try {
    stats = await fs.lstat(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") fail("文件或文件夹不存在", 404);
    throw error;
  }
  if (stats.isSymbolicLink()) fail("不允许修改符号链接", 403);
  return { relativePath, absolutePath, stats };
}

async function renamePublicItemUnsafe(inputPath: unknown, inputName?: unknown, inputDestination?: unknown) {
  const source = await checkedWritableItem(inputPath);
  const usages = await findPublicAssetUsages(source.relativePath);
  if (usages.length) fail("该素材正在被内容使用，不能重命名或移动", 409, usages);

  const sourceParent = source.relativePath.split("/").slice(0, -1).join("/");
  const destinationDirectory = inputDestination === undefined
    ? sourceParent
    : normalizePublicRelativePath(inputDestination, { allowRoot: true });
  assertWritableDirectory(destinationDirectory);
  await assertNoSymlinks(destinationDirectory);
  const destinationStats = await fs.stat(absoluteFromRelative(destinationDirectory)).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") fail("目标文件夹不存在", 404);
    throw error;
  });
  if (!destinationStats.isDirectory()) fail("目标路径不是文件夹");

  const currentName = source.relativePath.split("/").pop() as string;
  const name = inputName === undefined ? currentName : normalizePublicName(inputName);
  if (source.stats.isFile() && extensionOf(name) !== extensionOf(currentName)) {
    fail("重命名文件时不能更改文件扩展名");
  }
  const destinationRelative = destinationDirectory ? `${destinationDirectory}/${name}` : name;
  assertWritableItem(destinationRelative);
  if (destinationRelative === source.relativePath) return destinationRelative;
  const destinationAbsolute = absoluteFromRelative(destinationRelative);
  await assertNoSymlinks(destinationRelative, true);
  try {
    await fs.access(destinationAbsolute);
    fail("目标位置已有同名文件或文件夹", 409);
  } catch (error) {
    if (error instanceof PublicFileError) throw error;
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  try {
    if (source.stats.isFile()) {
      // Hard-link creation is atomic and never overwrites an existing path.
      // Both locations are under one uploads volume, so they share a filesystem.
      await fs.link(source.absolutePath, destinationAbsolute);
      await fs.unlink(source.absolutePath);
    } else if (source.stats.isDirectory()) {
      // Node's POSIX rename may replace a concurrently-created empty directory.
      // Exclusive copy followed by removal trades atomicity for no data loss.
      await fs.cp(source.absolutePath, destinationAbsolute, {
        recursive: true,
        force: false,
        errorOnExist: true,
        preserveTimestamps: true,
      });
      await fs.rm(source.absolutePath, { recursive: true });
    } else {
      fail("不支持移动该类型的文件", 403);
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EEXIST" || code === "ERR_FS_CP_EEXIST") {
      fail("目标位置已有同名文件或文件夹", 409);
    }
    throw error;
  }
  return destinationRelative;
}

let renameQueue: Promise<void> = Promise.resolve();

export function renamePublicItem(inputPath: unknown, inputName?: unknown, inputDestination?: unknown) {
  const operation = renameQueue.then(
    () => renamePublicItemUnsafe(inputPath, inputName, inputDestination),
    () => renamePublicItemUnsafe(inputPath, inputName, inputDestination),
  );
  renameQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

export async function deletePublicItem(inputPath: unknown) {
  const target = await checkedWritableItem(inputPath);
  const usages = await findPublicAssetUsages(target.relativePath);
  if (usages.length) fail("该素材正在被内容使用，不能删除", 409, usages);
  if (target.stats.isDirectory()) {
    const entries = await fs.readdir(target.absolutePath);
    if (entries.length) fail("文件夹不为空，请先处理其中的文件", 409);
    await fs.rmdir(target.absolutePath);
  } else if (target.stats.isFile()) {
    await fs.unlink(target.absolutePath);
  } else {
    fail("不支持删除该类型的文件", 403);
  }
}

export async function getPublicUploadForRead(inputPath: unknown) {
  const suffix = normalizePublicRelativePath(inputPath);
  const relativePath = normalizePublicRelativePath(`uploads/${suffix}`);
  assertWritableItem(relativePath);
  await assertNoSymlinks(relativePath);
  const absolutePath = absoluteFromRelative(relativePath);
  const stats = await fs.stat(absolutePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") fail("文件不存在", 404);
    throw error;
  });
  if (!stats.isFile()) fail("文件不存在", 404);
  const media = kindAndMime(relativePath);
  if (media.kind === "other" || !media.mime) fail("不支持读取该文件类型", 415);
  return { absolutePath, mime: media.mime, size: stats.size, modifiedAt: stats.mtime };
}
