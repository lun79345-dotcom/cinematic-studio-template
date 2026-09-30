"use client";

import { withBasePath } from "@/lib/base-path";

import {
  ChevronRight,
  ExternalLink,
  File,
  FileImage,
  Folder,
  FolderOpen,
  FolderPlus,
  Home,
  Lock,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  errorFromPayload,
  fetchPublicDirectory,
  formatPublicFileDate,
  formatPublicFileSize,
  publicBreadcrumbs,
  type PublicAsset,
  type PublicDirectoryListing,
} from "@/components/admin/PublicFilePicker";
import { AdminStatus } from "@/components/admin/AdminFields";

type Filter = "all" | "image" | "video";
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readPayload(response: Response) {
  return response.json().catch(() => ({})) as Promise<unknown>;
}

function mutationError(payload: unknown, fallback: string) {
  const base = errorFromPayload(payload, fallback);
  if (!isRecord(payload) || !Array.isArray(payload.usages) || !payload.usages.length) return base;
  const usages = payload.usages.filter((usage): usage is string => typeof usage === "string");
  return usages.length ? `${base}；正在被以下内容使用：${usages.join("、")}` : base;
}

function AssetIcon({ asset, className = "size-5" }: { asset: PublicAsset; className?: string }) {
  if (asset.type === "directory") return <Folder className={className} strokeWidth={1.4} aria-hidden="true" />;
  if (asset.kind === "image") return <FileImage className={className} strokeWidth={1.4} aria-hidden="true" />;
  if (asset.kind === "video") return <Video className={className} strokeWidth={1.4} aria-hidden="true" />;
  return <File className={className} strokeWidth={1.4} aria-hidden="true" />;
}

function itemTypeLabel(asset: PublicAsset) {
  if (asset.type === "directory") return "文件夹";
  if (asset.kind === "image") return "图片";
  if (asset.kind === "video") return "视频";
  return "文件";
}

export function PublicFileManager() {
  const requestIdRef = useRef(0);
  const createInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [listing, setListing] = useState<PublicDirectoryListing | null>(null);
  const [selected, setSelected] = useState<PublicAsset | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDirectory = useCallback(async (path: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const next = await fetchPublicDirectory(path);
      if (requestId !== requestIdRef.current) return null;
      setListing(next);
      setSelected(null);
      setRenaming(false);
      setShowCreate(false);
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
    void loadDirectory("uploads");
  }, [loadDirectory]);

  useEffect(() => {
    if (showCreate) createInputRef.current?.focus();
  }, [showCreate]);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  const visibleItems = useMemo(() => {
    if (!listing) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
    return listing.items.filter((asset) => {
      if (asset.type === "file" && filter !== "all" && asset.kind !== filter) return false;
      return !normalizedQuery || asset.name.toLocaleLowerCase("zh-CN").includes(normalizedQuery);
    });
  }, [filter, listing, query]);

  const busy = loading || uploading || mutating;

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function navigate(path: string) {
    clearStatus();
    void loadDirectory(path);
  }

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name || !listing?.writable) return;
    setMutating(true);
    clearStatus();
    try {
      const response = await fetch(withBasePath("/api/admin/files"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: listing.path, name }),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(mutationError(payload, "新建文件夹失败"));
      await loadDirectory(listing.path);
      setNewFolderName("");
      setShowCreate(false);
      setMessage(`文件夹“${name}”已创建`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "新建文件夹失败");
    } finally {
      setMutating(false);
    }
  }

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || !listing?.writable) return;
    setUploading(true);
    clearStatus();
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("path", listing.path);
        body.append("file", file);
        const response = await fetch(withBasePath("/api/admin/files/upload"), { method: "POST", body });
        const payload = await readPayload(response);
        if (!response.ok) throw new Error(mutationError(payload, `上传“${file.name}”失败`));
      }
      await loadDirectory(listing.path);
      setMessage(files.length === 1 ? `“${files[0].name}”已上传` : `已上传 ${files.length} 个文件`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "上传文件失败");
    } finally {
      setUploading(false);
    }
  }

  function beginRename() {
    if (!selected?.writable || selected.readOnly) return;
    clearStatus();
    setRenameName(selected.name);
    setRenaming(true);
  }

  async function renameSelected(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = renameName.trim();
    if (!selected || !name || !selected.writable || selected.readOnly || !listing) return;
    if (name === selected.name) {
      setRenaming(false);
      return;
    }
    setMutating(true);
    clearStatus();
    try {
      const response = await fetch(withBasePath("/api/admin/files/item"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selected.path, name }),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(mutationError(payload, "重命名失败"));
      await loadDirectory(listing.path);
      setMessage(`“${selected.name}”已重命名为“${name}”`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "重命名失败");
    } finally {
      setMutating(false);
    }
  }

  async function deleteSelected() {
    if (!selected || !selected.writable || selected.readOnly || !listing) return;
    const detail = selected.type === "directory" ? "文件夹需为空，删除后无法恢复。" : "删除后，引用此文件的页面可能无法正常显示。";
    if (!window.confirm(`确定删除“${selected.name}”吗？\n${detail}`)) return;
    setMutating(true);
    clearStatus();
    try {
      const response = await fetch(withBasePath(`/api/admin/files/item?path=${encodeURIComponent(selected.path)}`), { method: "DELETE" });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(mutationError(payload, "删除失败"));
      const deletedName = selected.name;
      await loadDirectory(listing.path);
      setMessage(`“${deletedName}”已删除`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "删除失败");
    } finally {
      setMutating(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-14">
      <div className="flex flex-col gap-5 border-b border-line/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">公共文件</h1>
            <span className="rounded-control bg-line/[0.06] px-2 py-1 font-mono text-[11px] text-bone/55">public</span>
          </div>
          <p className="mt-2 max-w-[65ch] text-sm leading-6 text-bone/55">
            集中管理后台可复用的图片和视频。内置站点素材保持只读，上传内容请存放在可写目录中。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              clearStatus();
              setNewFolderName("");
              setShowCreate(true);
            }}
            disabled={!listing?.writable || busy}
            title={!listing?.writable ? "当前目录不可写" : undefined}
            className="inline-flex min-h-10 items-center gap-2 rounded-control border border-line/15 px-4 text-sm text-bone transition-colors hover:border-line/30 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <FolderPlus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            新建文件夹
          </button>
          <label className={`inline-flex min-h-10 items-center gap-2 rounded-control px-4 text-sm font-medium transition-colors ${listing?.writable && !busy ? "cursor-pointer bg-gold text-ink hover:bg-accentHover" : "cursor-not-allowed bg-line/[0.07] text-bone/35"}`} title={!listing?.writable ? "当前目录不可写" : undefined}>
            <Upload className="size-4" strokeWidth={1.55} aria-hidden="true" />
            {uploading ? "上传中" : "上传图片 / 视频"}
            <input type="file" multiple accept="image/*,video/*" disabled={!listing?.writable || busy} onChange={(event) => void uploadFiles(event)} className="sr-only" />
          </label>
        </div>
      </div>

      <div className="mt-5">
        <AdminStatus message={message} error={error} busyLabel={uploading ? "正在上传文件，请勿关闭页面" : mutating ? "正在更新公共文件" : undefined} />
      </div>

      <div className="mt-7 grid min-h-[620px] overflow-hidden rounded-card border border-line/10 bg-line/[0.015] lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="min-w-0 border-b border-line/10 lg:border-b-0 lg:border-r">
          <div className="border-b border-line/10 p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <nav aria-label="公共文件夹路径" className="flex min-h-9 min-w-0 items-center gap-1 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => navigate("")}
                  aria-current={listing?.path === "" ? "page" : undefined}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control px-2.5 text-bone/60 hover:bg-line/[0.05] hover:text-bone"
                >
                  <Home className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  public
                </button>
                {publicBreadcrumbs(listing?.path ?? "").map((crumb) => (
                  <span key={crumb.path} className="flex shrink-0 items-center gap-1">
                    <ChevronRight className="size-3.5 text-bone/25" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => navigate(crumb.path)}
                      aria-current={crumb.path === listing?.path ? "page" : undefined}
                      className={`min-h-9 rounded-control px-2.5 ${crumb.path === listing?.path ? "bg-line/[0.07] text-bone" : "text-bone/60 hover:bg-line/[0.05] hover:text-bone"}`}
                    >
                      {crumb.name}
                    </button>
                  </span>
                ))}
              </nav>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-control px-2.5 text-[11px] ${listing?.writable ? "bg-gold/10 text-gold" : "bg-line/[0.06] text-bone/55"}`}>
                  {listing?.writable ? <FolderOpen className="size-3.5" strokeWidth={1.5} aria-hidden="true" /> : <Lock className="size-3.5" strokeWidth={1.5} aria-hidden="true" />}
                  {listing?.writable ? "可写目录" : "受保护目录"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearStatus();
                    void loadDirectory(listing?.path ?? "");
                  }}
                  disabled={busy}
                  aria-label="刷新当前文件夹"
                  className="grid size-9 place-items-center rounded-control text-bone/50 hover:bg-line/[0.06] hover:text-bone disabled:opacity-35"
                >
                  <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">搜索当前文件夹</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bone/40" strokeWidth={1.5} aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索当前文件夹"
                  className="h-10 w-full rounded-control border border-line/15 bg-line/[0.03] pl-10 pr-3 text-sm text-bone outline-none placeholder:text-bone/45 hover:border-line/25 focus:border-gold"
                />
              </label>
              <div aria-label="文件类型筛选" className="flex shrink-0 rounded-control border border-line/10 bg-line/[0.025] p-1">
                {([{ value: "all", label: "全部" }, { value: "image", label: "图片" }, { value: "video", label: "视频" }] as const).map((option) => (
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
            </div>

            {showCreate ? (
              <form onSubmit={createFolder} className="mt-4 flex flex-col gap-2 rounded-control border border-gold/25 bg-gold/[0.06] p-3 sm:flex-row sm:items-center">
                <FolderPlus className="hidden size-4 shrink-0 text-gold sm:block" strokeWidth={1.5} aria-hidden="true" />
                <label className="min-w-0 flex-1">
                  <span className="sr-only">新文件夹名称</span>
                  <input
                    ref={createInputRef}
                    value={newFolderName}
                    onChange={(event) => setNewFolderName(event.target.value)}
                    placeholder="输入文件夹名称"
                    required
                    className="h-10 w-full rounded-control border border-line/15 bg-ink/45 px-3 text-sm text-bone outline-none placeholder:text-bone/45 focus:border-gold"
                  />
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="min-h-10 rounded-control px-3 text-xs text-bone/60 hover:bg-line/[0.05] hover:text-bone">取消</button>
                  <button type="submit" disabled={!newFolderName.trim() || mutating} className="min-h-10 rounded-control bg-gold px-4 text-xs font-medium text-ink disabled:opacity-35">创建</button>
                </div>
              </form>
            ) : null}
          </div>

          <div className="p-4 sm:p-5">
            {loading && !listing ? (
              <div aria-label="正在读取文件" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-control bg-line/[0.05]" />)}
              </div>
            ) : error && !listing ? (
              <div role="alert" className="grid min-h-48 place-items-center rounded-control border border-red-300/20 bg-red-400/[0.05] px-6 text-center">
                <div>
                  <p className="text-sm text-red-200">{error}</p>
                  <button type="button" onClick={() => void loadDirectory("")} className="mt-3 min-h-9 rounded-control border border-red-200/25 px-3 text-xs text-red-100 hover:bg-red-300/10">重新读取</button>
                </div>
              </div>
            ) : visibleItems.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {visibleItems.map((asset) => {
                  const active = selected?.path === asset.path;
                  return (
                    <article key={asset.path} className={`group min-w-0 overflow-hidden rounded-control border transition-colors ${active ? "border-gold bg-gold/[0.07]" : "border-line/10 bg-line/[0.025] hover:border-line/25"}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(asset);
                          setRenaming(false);
                          clearStatus();
                        }}
                        onDoubleClick={() => asset.type === "directory" && navigate(asset.path)}
                        aria-pressed={active}
                        className="block w-full min-w-0 text-left"
                      >
                        <span className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-line/10 ${asset.type === "directory" ? "bg-line/[0.025] text-gold/75" : "bg-black/45 text-bone/40"}`}>
                          {asset.type === "file" && asset.kind === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={withBasePath(asset.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <AssetIcon asset={asset} className={asset.type === "directory" ? "size-10" : "size-8"} />
                          )}
                          {asset.readOnly ? (
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-control bg-black/70 px-1.5 py-1 text-[10px] text-white/75">
                              <Lock className="size-3" strokeWidth={1.5} aria-hidden="true" />只读
                            </span>
                          ) : null}
                        </span>
                        <span className="block px-3 py-2.5">
                          <strong className="block truncate text-xs font-medium text-bone">{asset.name}</strong>
                          <span className="mt-1 block truncate font-mono text-[10px] text-bone/40">
                            {asset.type === "directory" ? "文件夹" : `${itemTypeLabel(asset)} · ${formatPublicFileSize(asset.size)}`}
                          </span>
                        </span>
                      </button>
                      {asset.type === "directory" ? (
                        <button
                          type="button"
                          onClick={() => navigate(asset.path)}
                          className="flex min-h-9 w-full items-center justify-center gap-1.5 border-t border-line/10 px-3 text-[11px] text-bone/55 hover:bg-line/[0.05] hover:text-bone"
                        >
                          打开文件夹<ChevronRight className="size-3.5" aria-hidden="true" />
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="grid min-h-52 place-items-center rounded-control border border-dashed border-line/15 px-6 text-center">
                <div>
                  <FolderOpen className="mx-auto size-8 text-bone/25" strokeWidth={1.2} aria-hidden="true" />
                  <p className="mt-3 text-sm text-bone/55">{query ? "没有匹配的文件" : "当前文件夹为空"}</p>
                  <p className="mt-1 text-xs leading-5 text-bone/40">
                    {query ? "尝试修改搜索词或文件类型筛选。" : listing?.writable ? "上传图片、视频，或新建文件夹开始整理。" : "这是只读目录，无法在此添加内容。"}
                  </p>
                  {query ? <button type="button" onClick={() => setQuery("")} className="mt-2 min-h-8 px-2 text-xs text-gold hover:text-accentHover">清除搜索</button> : null}
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="min-w-0 bg-line/[0.015]">
          <div className="sticky top-20 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-bone">文件信息</h2>
              {selected?.readOnly ? (
                <span className="inline-flex items-center gap-1 rounded-control bg-line/[0.06] px-2 py-1 text-[10px] text-bone/55"><Lock className="size-3" strokeWidth={1.5} aria-hidden="true" />内置只读</span>
              ) : null}
            </div>

            {selected ? (
              <>
                <div className="mt-4 aspect-video overflow-hidden rounded-control border border-line/10 bg-black">
                  {selected.type === "file" && selected.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={withBasePath(selected.url)} alt={`${selected.name} 预览`} className="h-full w-full object-contain" />
                  ) : selected.type === "file" && selected.kind === "video" ? (
                    <video key={selected.url} src={withBasePath(selected.url)} controls muted playsInline preload="metadata" className="h-full w-full object-contain">当前浏览器不支持视频预览。</video>
                  ) : (
                    <div className="grid h-full place-items-center text-gold/65"><AssetIcon asset={selected} className="size-11" /></div>
                  )}
                </div>

                {renaming ? (
                  <form onSubmit={renameSelected} className="mt-4 rounded-control border border-gold/25 bg-gold/[0.06] p-3">
                    <label className="block text-xs font-medium text-bone/65">
                      新名称
                      <input
                        ref={renameInputRef}
                        value={renameName}
                        onChange={(event) => setRenameName(event.target.value)}
                        required
                        className="mt-2 h-10 w-full rounded-control border border-line/15 bg-ink/50 px-3 text-sm text-bone outline-none focus:border-gold"
                      />
                    </label>
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => setRenaming(false)} className="min-h-9 rounded-control px-3 text-xs text-bone/60 hover:bg-line/[0.06]">取消</button>
                      <button type="submit" disabled={!renameName.trim() || mutating} className="min-h-9 rounded-control bg-gold px-3 text-xs font-medium text-ink disabled:opacity-35">保存名称</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="mt-4 break-words text-sm font-medium leading-6 text-bone">{selected.name}</h3>
                    <dl className="mt-4 grid grid-cols-[64px_1fr] gap-x-3 gap-y-2 text-xs leading-5">
                      <dt className="text-bone/40">类型</dt>
                      <dd className="text-bone/65">{itemTypeLabel(selected)}</dd>
                      <dt className="text-bone/40">大小</dt>
                      <dd className="text-bone/65">{selected.type === "file" ? formatPublicFileSize(selected.size) : "—"}</dd>
                      <dt className="text-bone/40">修改时间</dt>
                      <dd className="text-bone/65">{formatPublicFileDate(selected.modifiedAt)}</dd>
                      <dt className="text-bone/40">路径</dt>
                      <dd className="break-all font-mono text-[11px] text-bone/65">/{selected.path}</dd>
                    </dl>
                  </>
                )}

                {!renaming ? (
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    {selected.type === "directory" ? (
                      <button type="button" onClick={() => navigate(selected.path)} className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-gold px-4 text-xs font-medium text-ink hover:bg-accentHover">
                        <FolderOpen className="size-4" strokeWidth={1.5} aria-hidden="true" />打开文件夹
                      </button>
                    ) : (
                      <a href={withBasePath(selected.url)} target="_blank" rel="noreferrer" className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-line/15 px-4 text-xs text-bone hover:border-line/30">
                        <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden="true" />在新窗口查看
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={beginRename}
                      disabled={!selected.writable || selected.readOnly || busy}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-line/15 px-3 text-xs text-bone/70 hover:border-line/30 hover:text-bone disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Pencil className="size-3.5" strokeWidth={1.5} aria-hidden="true" />重命名
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteSelected()}
                      disabled={!selected.writable || selected.readOnly || busy}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-red-300/20 px-3 text-xs text-red-200 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} aria-hidden="true" />删除
                    </button>
                  </div>
                ) : null}

                {selected.readOnly ? <p className="mt-4 text-xs leading-5 text-bone/45">内置素材由站点代码维护，可浏览和选择，但不能在后台重命名或删除。</p> : null}
              </>
            ) : (
              <div className="mt-4 grid min-h-52 place-items-center rounded-control border border-dashed border-line/15 px-5 text-center">
                <div>
                  <FileImage className="mx-auto size-8 text-bone/25" strokeWidth={1.2} aria-hidden="true" />
                  <p className="mt-3 text-xs leading-5 text-bone/45">选择一个文件或文件夹，查看预览、路径和可用操作。</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
