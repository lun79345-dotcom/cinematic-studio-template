"use client";

import { withBasePath } from "@/lib/base-path";

import {
  Check,
  ChevronRight,
  File,
  FileImage,
  Folder,
  Home,
  Lock,
  Search,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";

export type PublicAssetKind = "image" | "video" | "other";

export type PublicAsset = {
  name: string;
  path: string;
  type: "file" | "directory";
  kind: PublicAssetKind;
  url: string;
  mime: string | null;
  mimeType: string | null;
  size: number | null;
  modifiedAt: string | null;
  writable: boolean;
  readOnly: boolean;
};

export type PublicDirectoryListing = {
  path: string;
  parent: string | null;
  writable: boolean;
  readOnly: boolean;
  items: PublicAsset[];
};

export type PublicFilePickerProps = {
  value: string;
  accept: "image" | "video" | "both";
  onSelect: (url: string, asset: PublicAsset) => void;
  label?: string;
  hint?: string;
  purpose?: "logo";
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
};

type UnknownRecord = Record<string, unknown>;
type Filter = "all" | "image" | "video";

const imageExtensions = new Set(["avif", "bmp", "gif", "heic", "heif", "jpeg", "jpg", "png", "svg", "webp"]);
const videoExtensions = new Set(["m4v", "mov", "mp4", "mpeg", "mpg", "ogv", "webm"]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizePublicPath(value: string) {
  return value.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
}

function joinPublicPath(parent: string, name: string) {
  return normalizePublicPath(parent ? `${parent}/${name}` : name);
}

function publicUrlForPath(path: string) {
  if (!path) return "";
  return `/${path.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
}

function extensionOf(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

function inferKind(name: string, mime: string | null): PublicAssetKind {
  if (mime?.startsWith("image/")) return "image";
  if (mime?.startsWith("video/")) return "video";
  const extension = extensionOf(name);
  if (imageExtensions.has(extension)) return "image";
  if (videoExtensions.has(extension)) return "video";
  return "other";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function normalizeAsset(value: unknown, directoryPath: string): PublicAsset | null {
  if (!isRecord(value)) return null;
  const rawName = stringValue(value.name);
  const rawPath = normalizePublicPath(stringValue(value.path) || joinPublicPath(directoryPath, rawName));
  const name = rawName || rawPath.split("/").pop() || "未命名文件";
  const type = value.type === "directory" || value.kind === "directory" || value.isDirectory === true
    ? "directory"
    : "file";
  const mime = nullableString(value.mime) ?? nullableString(value.mimeType);
  const rawKind = value.kind;
  const kind: PublicAssetKind = type === "file" && (rawKind === "image" || rawKind === "video" || rawKind === "other")
    ? rawKind
    : type === "file"
      ? inferKind(name, mime)
      : "other";
  const readOnly = value.readOnly === true || value.readonly === true || value.writable === false;
  const writable = typeof value.writable === "boolean" ? value.writable : !readOnly;

  return {
    name,
    path: rawPath,
    type,
    kind,
    url: type === "file" ? stringValue(value.url) || publicUrlForPath(rawPath) : "",
    mime,
    mimeType: mime,
    size: typeof value.size === "number" && Number.isFinite(value.size) ? value.size : null,
    modifiedAt: nullableString(value.modifiedAt),
    writable,
    readOnly,
  };
}

export function parsePublicDirectoryListing(value: unknown): PublicDirectoryListing {
  if (!isRecord(value)) throw new Error("服务器返回了无法识别的文件列表");
  const path = normalizePublicPath(stringValue(value.path));
  const rawItems = Array.isArray(value.items) ? value.items : [];
  const parentValue = value.parent;
  return {
    path,
    parent: typeof parentValue === "string" ? normalizePublicPath(parentValue) : null,
    writable: value.writable === true,
    readOnly: value.readOnly === true || value.readonly === true,
    items: rawItems
      .map((item) => normalizeAsset(item, path))
      .filter((item): item is PublicAsset => item !== null),
  };
}

async function responsePayload(response: Response) {
  return response.json().catch(() => ({})) as Promise<unknown>;
}

export function errorFromPayload(payload: unknown, fallback: string) {
  if (isRecord(payload) && typeof payload.error === "string" && payload.error) return payload.error;
  return fallback;
}

export async function fetchPublicDirectory(path: string, signal?: AbortSignal) {
  const response = await fetch(withBasePath(`/api/admin/files?path=${encodeURIComponent(normalizePublicPath(path))}`), {
    cache: "no-store",
    signal,
  });
  const payload = await responsePayload(response);
  if (!response.ok) throw new Error(errorFromPayload(payload, "读取公共文件夹失败"));
  return parsePublicDirectoryListing(payload);
}

export function formatPublicFileSize(size: number | null) {
  if (size === null) return "—";
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatPublicFileDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function publicBreadcrumbs(path: string) {
  const segments = normalizePublicPath(path).split("/").filter(Boolean);
  return segments.map((name, index) => ({
    name,
    path: segments.slice(0, index + 1).join("/"),
  }));
}

function acceptsAsset(asset: PublicAsset, accept: PublicFilePickerProps["accept"]) {
  if (asset.type === "directory") return true;
  if (accept === "both") return asset.kind === "image" || asset.kind === "video";
  return asset.kind === accept;
}

function fileInputAccept(accept: PublicFilePickerProps["accept"]) {
  if (accept === "image") return "image/*";
  if (accept === "video") return "video/*";
  return "image/*,video/*";
}

function valueKind(value: string): PublicAssetKind {
  return inferKind(value.split(/[?#]/)[0], null);
}

function AssetIcon({ asset, className = "size-5" }: { asset: PublicAsset; className?: string }) {
  if (asset.type === "directory") return <Folder className={className} strokeWidth={1.45} aria-hidden="true" />;
  if (asset.kind === "image") return <FileImage className={className} strokeWidth={1.45} aria-hidden="true" />;
  if (asset.kind === "video") return <Video className={className} strokeWidth={1.45} aria-hidden="true" />;
  return <File className={className} strokeWidth={1.45} aria-hidden="true" />;
}

function PreviewMedia({ asset, logo = false }: { asset: PublicAsset; logo?: boolean }) {
  if (asset.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={withBasePath(asset.url)}
        alt={`${asset.name} 预览`}
        className={`h-full w-full ${logo ? "object-contain p-5" : "object-contain"}`}
      />
    );
  }
  if (asset.kind === "video") {
    return (
      <video
        key={asset.url}
        src={withBasePath(asset.url)}
        controls
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
      >
        当前浏览器不支持视频预览。
      </video>
    );
  }
  return (
    <div className="grid h-full place-items-center text-bone/35">
      <File className="size-10" strokeWidth={1.2} aria-hidden="true" />
    </div>
  );
}

function PickerDialog({
  open,
  accept,
  purpose,
  currentValue,
  onClose,
  onConfirm,
}: {
  open: boolean;
  accept: PublicFilePickerProps["accept"];
  purpose?: "logo";
  currentValue: string;
  onClose: () => void;
  onConfirm: (asset: PublicAsset) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const titleId = useId();
  const [listing, setListing] = useState<PublicDirectoryListing | null>(null);
  const [selected, setSelected] = useState<PublicAsset | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(accept === "both" ? "all" : accept);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDirectory = useCallback(async (path: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const next = await fetchPublicDirectory(path);
      if (requestId !== requestIdRef.current) return null;
      setListing(next);
      setSelected(null);
      setQuery("");
      return next;
    } catch (reason) {
      if (requestId === requestIdRef.current) {
        setError(reason instanceof Error ? reason.message : "读取公共文件夹失败");
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setFilter(accept === "both" ? "all" : accept);
      setSelected(null);
      void loadDirectory("");
      window.setTimeout(() => searchRef.current?.focus(), 0);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [accept, loadDirectory, open]);

  const visibleItems = useMemo(() => {
    if (!listing) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
    return listing.items.filter((asset) => {
      if (!acceptsAsset(asset, accept)) return false;
      if (asset.type === "file" && filter !== "all" && asset.kind !== filter) return false;
      return !normalizedQuery || asset.name.toLocaleLowerCase("zh-CN").includes(normalizedQuery);
    });
  }, [accept, filter, listing, query]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || !listing?.writable) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      let latestUploaded: PublicAsset | null = null;
      for (const file of files) {
        const body = new FormData();
        body.append("path", listing.path);
        body.append("file", file);
        if (purpose) body.append("purpose", purpose);
        const response = await fetch(withBasePath("/api/admin/files/upload"), { method: "POST", body });
        const payload = await responsePayload(response);
        if (!response.ok) throw new Error(errorFromPayload(payload, `上传“${file.name}”失败`));
        if (isRecord(payload)) {
          latestUploaded = normalizeAsset(payload.asset, listing.path) ?? latestUploaded;
        }
      }
      await loadDirectory(listing.path);
      if (latestUploaded && acceptsAsset(latestUploaded, accept)) setSelected(latestUploaded);
      setMessage(files.length > 1 ? `已上传 ${files.length} 个文件` : `“${files[0].name}”已上传`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "上传文件失败");
    } finally {
      setUploading(false);
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    if (!inside) onClose();
  }

  const filters: Array<{ value: Filter; label: string }> = accept === "both"
    ? [{ value: "all", label: "全部" }, { value: "image", label: "图片" }, { value: "video", label: "视频" }]
    : [{ value: accept, label: accept === "image" ? "图片" : "视频" }];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onMouseDown={handleBackdropClick}
      className="m-auto h-[min(860px,calc(100dvh-2rem))] w-[min(1180px,calc(100vw-2rem))] max-w-none overflow-hidden rounded-card border border-line/15 bg-carbon p-0 text-bone shadow-none backdrop:bg-black/80 sm:h-[min(860px,calc(100dvh-3rem))] sm:w-[min(1180px,calc(100vw-3rem))]"
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-6 border-b border-line/10 px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-[-0.02em]">选择公共文件</h2>
            <p className="mt-1 text-xs leading-5 text-bone/55">
              从公共目录选择{accept === "image" ? "图片" : accept === "video" ? "视频" : "图片或视频"}，也可上传到有写入权限的目录。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭公共文件选择器"
            className="grid size-11 shrink-0 place-items-center rounded-control text-bone/55 transition-colors hover:bg-line/[0.06] hover:text-bone"
          >
            <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_310px]">
          <section className="flex min-h-0 flex-1 flex-col border-b border-line/10 lg:border-b-0 lg:border-r">
            <div className="shrink-0 border-b border-line/10 px-5 py-4 sm:px-6">
              <nav aria-label="公共文件夹路径" className="flex min-h-8 items-center gap-1 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => void loadDirectory("")}
                  aria-current={listing?.path === "" ? "page" : undefined}
                  className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-control px-2 text-bone/60 hover:bg-line/[0.05] hover:text-bone"
                >
                  <Home className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  public
                </button>
                {publicBreadcrumbs(listing?.path ?? "").map((crumb) => (
                  <span key={crumb.path} className="flex shrink-0 items-center gap-1">
                    <ChevronRight className="size-3.5 text-bone/25" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => void loadDirectory(crumb.path)}
                      aria-current={crumb.path === listing?.path ? "page" : undefined}
                      className={`min-h-8 rounded-control px-2 ${crumb.path === listing?.path ? "bg-line/[0.06] text-bone" : "text-bone/60 hover:bg-line/[0.05] hover:text-bone"}`}
                    >
                      {crumb.name}
                    </button>
                  </span>
                ))}
              </nav>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">搜索当前文件夹</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bone/40" strokeWidth={1.5} aria-hidden="true" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索当前文件夹"
                    className="h-10 w-full rounded-control border border-line/15 bg-line/[0.035] pl-10 pr-3 text-sm text-bone outline-none placeholder:text-bone/45 hover:border-line/25 focus:border-gold"
                  />
                </label>
                <div aria-label="文件类型筛选" className="flex shrink-0 rounded-control border border-line/10 bg-line/[0.025] p-1">
                  {filters.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFilter(option.value)}
                      aria-pressed={filter === option.value}
                      className={`min-h-8 rounded-[7px] px-3 text-xs transition-colors ${filter === option.value ? "bg-line/[0.1] text-bone" : "text-bone/50 hover:text-bone"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <label className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control px-3 text-xs font-medium transition-colors ${listing?.writable && !uploading ? "cursor-pointer bg-gold text-ink hover:bg-accentHover" : "cursor-not-allowed bg-line/[0.06] text-bone/35"}`}>
                  <Upload className="size-4" strokeWidth={1.6} aria-hidden="true" />
                  {uploading ? "上传中" : "上传"}
                  <input
                    type="file"
                    multiple
                    accept={fileInputAccept(accept)}
                    disabled={!listing?.writable || uploading}
                    onChange={(event) => void upload(event)}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="mt-3 flex min-h-5 items-center justify-between gap-3 text-xs">
                <p className={listing?.writable ? "text-bone/45" : "inline-flex items-center gap-1.5 text-bone/55"}>
                  {!listing?.writable ? <Lock className="size-3.5" strokeWidth={1.5} aria-hidden="true" /> : null}
                  {listing?.writable ? "当前目录可上传文件" : "当前目录只读；进入 uploads 目录后可上传"}
                </p>
                {listing ? <span className="shrink-0 font-mono text-bone/35">{visibleItems.length} 项</span> : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {error && !listing ? (
                <div role="alert" className="flex min-h-32 flex-col items-center justify-center rounded-control border border-red-300/20 bg-red-400/[0.06] px-5 text-center">
                  <p className="text-sm text-red-200">{error}</p>
                  <button type="button" onClick={() => void loadDirectory("")} className="mt-3 min-h-9 rounded-control border border-red-200/25 px-3 text-xs text-red-100 hover:bg-red-300/10">重新读取</button>
                </div>
              ) : loading ? (
                <div aria-label="正在读取文件" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-control bg-line/[0.05]" />)}
                </div>
              ) : visibleItems.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {visibleItems.map((asset) => {
                    const chosen = selected?.path === asset.path;
                    const isCurrent = asset.type === "file" && asset.url === currentValue;
                    return (
                      <button
                        key={asset.path}
                        type="button"
                        onClick={() => asset.type === "directory" ? void loadDirectory(asset.path) : setSelected(asset)}
                        onDoubleClick={() => {
                          if (asset.type === "file") onConfirm(asset);
                        }}
                        aria-pressed={asset.type === "file" ? chosen : undefined}
                        className={`group min-w-0 overflow-hidden rounded-control border text-left transition-colors ${chosen ? "border-gold bg-gold/[0.08]" : "border-line/10 bg-line/[0.025] hover:border-line/25 hover:bg-line/[0.045]"}`}
                      >
                        <span className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-line/10 ${asset.type === "directory" ? "bg-line/[0.025] text-gold/75" : "bg-black/45 text-bone/40"}`}>
                          {asset.type === "file" && asset.kind === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={withBasePath(asset.url)} alt="" loading="lazy" className={`h-full w-full ${purpose === "logo" ? "object-contain p-3" : "object-cover"}`} />
                          ) : (
                            <AssetIcon asset={asset} className={asset.type === "directory" ? "size-10" : "size-8"} />
                          )}
                          {chosen || isCurrent ? (
                            <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-gold text-ink">
                              <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
                              <span className="sr-only">{chosen ? "已选择" : "当前文件"}</span>
                            </span>
                          ) : null}
                          {asset.readOnly ? (
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-control bg-black/70 px-1.5 py-1 text-[10px] text-white/75">
                              <Lock className="size-3" strokeWidth={1.5} aria-hidden="true" />只读
                            </span>
                          ) : null}
                        </span>
                        <span className="block px-3 py-2.5">
                          <strong className="block truncate text-xs font-medium text-bone">{asset.name}</strong>
                          <span className="mt-1 block truncate font-mono text-[10px] text-bone/40">
                            {asset.type === "directory" ? "文件夹 · 点击进入" : `${asset.kind === "image" ? "图片" : "视频"} · ${formatPublicFileSize(asset.size)}`}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid min-h-40 place-items-center rounded-control border border-dashed border-line/15 px-5 text-center">
                  <div>
                    <Search className="mx-auto size-7 text-bone/25" strokeWidth={1.3} aria-hidden="true" />
                    <p className="mt-3 text-sm text-bone/55">{query ? "当前文件夹没有匹配项" : "当前文件夹没有可选文件"}</p>
                    {query ? <button type="button" onClick={() => setQuery("")} className="mt-2 min-h-8 px-2 text-xs text-gold hover:text-accentHover">清除搜索</button> : null}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="flex max-h-[38%] min-h-0 shrink-0 flex-col bg-line/[0.015] lg:max-h-none">
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              <p className="text-xs font-medium text-bone/55">选择预览</p>
              {selected ? (
                <>
                  <div className={`mt-4 aspect-video overflow-hidden rounded-control border border-line/10 ${purpose === "logo" ? "bg-white" : "bg-black"}`}>
                    <PreviewMedia asset={selected} logo={purpose === "logo"} />
                  </div>
                  <h3 className="mt-4 break-words text-sm font-medium text-bone">{selected.name}</h3>
                  <dl className="mt-4 grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 text-xs leading-5">
                    <dt className="text-bone/40">类型</dt>
                    <dd className="text-bone/65">{selected.kind === "image" ? "图片" : "视频"}</dd>
                    <dt className="text-bone/40">大小</dt>
                    <dd className="text-bone/65">{formatPublicFileSize(selected.size)}</dd>
                    <dt className="text-bone/40">路径</dt>
                    <dd className="break-all font-mono text-[11px] text-bone/65">/{selected.path}</dd>
                  </dl>
                </>
              ) : (
                <div className="mt-4 grid min-h-44 place-items-center rounded-control border border-dashed border-line/15 px-5 text-center">
                  <div>
                    <FileImage className="mx-auto size-8 text-bone/25" strokeWidth={1.2} aria-hidden="true" />
                    <p className="mt-3 text-xs leading-5 text-bone/45">选择一个文件后，可在这里确认画面和文件信息。</p>
                  </div>
                </div>
              )}
              <p role={error ? "alert" : "status"} aria-live="polite" className={`mt-4 min-h-5 text-xs leading-5 ${error ? "text-red-200" : "text-gold"}`}>
                {error || message}
              </p>
            </div>
            <div className="flex shrink-0 gap-2 border-t border-line/10 p-5 sm:p-6">
              <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-control border border-line/15 px-4 text-sm text-bone/65 hover:border-line/30 hover:text-bone">取消</button>
              <button
                type="button"
                onClick={() => selected && onConfirm(selected)}
                disabled={!selected}
                className="min-h-11 flex-1 rounded-control bg-gold px-4 text-sm font-medium text-ink hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-35"
              >
                使用此文件
              </button>
            </div>
          </aside>
        </div>
      </div>
    </dialog>
  );
}

export function PublicFilePicker({
  value,
  accept,
  onSelect,
  label = "公共文件",
  hint,
  purpose,
  className = "",
  disabled = false,
  allowClear = false,
}: PublicFilePickerProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const currentKind = valueKind(value);

  useEffect(() => setMounted(true), []);

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-3 text-xs font-medium text-bone/70">
        <span>{label}</span>
        {hint ? <span className="text-right font-normal text-bone/45">{hint}</span> : null}
      </div>
      <div className="mt-2 flex min-h-16 items-center gap-3 rounded-control border border-line/15 bg-line/[0.035] p-2 transition-colors hover:border-line/25 focus-within:border-gold">
        <div className={`grid size-12 shrink-0 place-items-center overflow-hidden rounded-[7px] border border-line/10 ${purpose === "logo" ? "bg-white" : "bg-black/40"}`}>
          {value && currentKind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={withBasePath(value)} alt="" className={`h-full w-full ${purpose === "logo" ? "object-contain p-1.5" : "object-cover"}`} />
          ) : value && currentKind === "video" ? (
            <Video className="size-5 text-gold/75" strokeWidth={1.45} aria-hidden="true" />
          ) : (
            <FileImage className="size-5 text-bone/30" strokeWidth={1.4} aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm ${value ? "text-bone" : "text-bone/45"}`}>{value || "尚未选择公共文件"}</p>
          <p className="mt-1 text-xs text-bone/40">
            {accept === "image" ? "支持公共图片" : accept === "video" ? "支持公共视频" : "支持公共图片与视频"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {allowClear && value ? (
            <button
              type="button"
              onClick={() => onSelect("", {
                name: "",
                path: "",
                type: "file",
                kind: "other",
                url: "",
                mime: null,
                mimeType: null,
                size: null,
                modifiedAt: null,
                writable: false,
                readOnly: true,
              })}
              disabled={disabled}
              aria-label={`清空${label}`}
              className="grid size-10 place-items-center rounded-control border border-line/10 text-bone/45 transition-colors hover:border-line/25 hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={disabled}
            className="min-h-10 rounded-control border border-line/15 px-3 text-xs font-medium text-bone transition-colors hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
          >
            {value ? "更换" : "选择"}
          </button>
        </div>
      </div>
      {mounted
        ? createPortal(
          <PickerDialog
            open={open}
            accept={accept}
            purpose={purpose}
            currentValue={value}
            onClose={() => setOpen(false)}
            onConfirm={(asset) => {
              onSelect(asset.url, asset);
              setOpen(false);
            }}
          />,
          document.body,
        )
        : null}
    </div>
  );
}
