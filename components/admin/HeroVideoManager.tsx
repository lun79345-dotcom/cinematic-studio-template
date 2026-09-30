"use client";

import { withBasePath } from "@/lib/base-path";

import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Video } from "lucide-react";
import { AdminField, AdminStatus, AdminToggle } from "@/components/admin/AdminFields";
import { PublicFilePicker, type PublicAsset } from "@/components/admin/PublicFilePicker";
import type { HeroVideo, HeroVideoInput } from "@/types/hero-video";

const defaultVideo = (): HeroVideoInput => ({
  name: { zh: "", en: "" },
  src: "",
  enabled: true,
});

function toInput(video: HeroVideo): HeroVideoInput {
  return {
    name: { ...video.name },
    src: video.src,
    ...(video.poster ? { poster: video.poster } : {}),
    enabled: video.enabled,
  };
}

type ApiError = { error?: string };

async function readPayload(response: Response) {
  return (await response.json().catch(() => ({}))) as ApiError | HeroVideo | HeroVideo[];
}

function getError(payload: ApiError | HeroVideo | HeroVideo[], fallback: string) {
  return !Array.isArray(payload) && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : fallback;
}

function getVideo(payload: ApiError | HeroVideo | HeroVideo[]) {
  if (!Array.isArray(payload) && "id" in payload) return payload as HeroVideo;
  throw new Error("服务器没有返回视频数据");
}

function getVideos(payload: ApiError | HeroVideo | HeroVideo[]) {
  if (Array.isArray(payload)) return payload;
  throw new Error("服务器没有返回视频列表");
}

function isPreviewableSource(src: string) {
  return /^\/(?!\/).+\.(?:mp4|webm|mov)$/i.test(src);
}

export function HeroVideoManager({ initialVideos }: { initialVideos: HeroVideo[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const [selectedId, setSelectedId] = useState<string | null>(initialVideos[0]?.id ?? null);
  const [draft, setDraft] = useState<HeroVideoInput>(initialVideos[0] ? toInput(initialVideos[0]) : defaultVideo());
  const [saving, setSaving] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState("");

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function select(video: HeroVideo) {
    setSelectedId(video.id);
    setDraft(toInput(video));
    setPreviewError("");
    clearStatus();
  }

  function startNew() {
    setSelectedId(null);
    setDraft(defaultVideo());
    setPreviewError("");
    clearStatus();
  }

  function updateName(language: "zh" | "en", value: string) {
    setDraft((current) => ({
      ...current,
      name: { ...current.name, [language]: value },
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    clearStatus();

    try {
      const response = await fetch(
        withBasePath(selectedId ? `/api/admin/videos/${encodeURIComponent(selectedId)}` : "/api/admin/videos"),
        {
          method: selectedId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(getError(payload, "保存背景视频失败"));

      const saved = getVideo(payload);
      setVideos((current) => selectedId
        ? current.map((video) => video.id === selectedId ? saved : video)
        : [...current, saved]);
      setSelectedId(saved.id);
      setDraft(toInput(saved));
      setMessage(selectedId ? "背景视频已更新" : "背景视频已添加到列表");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存背景视频失败");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selectedId) return;
    const current = videos.find((video) => video.id === selectedId);
    const label = current?.name.zh || current?.name.en || "该视频";
    if (!window.confirm(`确定删除“${label}”的配置吗？磁盘中的视频文件会保留。`)) return;

    setSaving(true);
    clearStatus();
    try {
      const response = await fetch(withBasePath(`/api/admin/videos/${encodeURIComponent(selectedId)}`), {
        method: "DELETE",
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(getError(payload, "删除背景视频失败"));

      const removedIndex = videos.findIndex((video) => video.id === selectedId);
      const next = videos.filter((video) => video.id !== selectedId);
      setVideos(next);
      const nextSelected = next[Math.min(removedIndex, Math.max(0, next.length - 1))];
      if (nextSelected) select(nextSelected);
      else startNew();
      setMessage("视频配置已删除，媒体文件未被删除");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "删除背景视频失败");
    } finally {
      setSaving(false);
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const index = videos.findIndex((video) => video.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= videos.length) return;

    const previous = videos;
    const next = [...videos];
    [next[index], next[target]] = [next[target], next[index]];
    setVideos(next);
    setReorderingId(id);
    clearStatus();

    try {
      const response = await fetch(withBasePath("/api/admin/videos?action=reorder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((video) => video.id) }),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(getError(payload, "更新视频顺序失败"));
      setVideos(getVideos(payload));
      setMessage("首页背景视频顺序已更新");
    } catch (reason) {
      setVideos(previous);
      setError(reason instanceof Error ? reason.message : "更新视频顺序失败");
    } finally {
      setReorderingId(null);
    }
  }

  async function toggleEnabled(video: HeroVideo, enabled: boolean) {
    setVideos((current) => current.map((item) => item.id === video.id ? { ...item, enabled } : item));
    if (selectedId === video.id) {
      setDraft((current) => ({ ...current, enabled }));
    }
    setTogglingId(video.id);
    clearStatus();

    try {
      const response = await fetch(withBasePath(`/api/admin/videos/${encodeURIComponent(video.id)}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...toInput(video), enabled }),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(getError(payload, "更新视频启停状态失败"));

      const saved = getVideo(payload);
      setVideos((current) => current.map((item) => item.id === saved.id ? saved : item));
      if (selectedId === saved.id) {
        setDraft((current) => ({ ...current, enabled: saved.enabled }));
      }
      const label = saved.name.zh || saved.name.en;
      setMessage(enabled ? `“${label}”已加入首页播放` : `“${label}”已从首页播放中停用`);
    } catch (reason) {
      setVideos((current) => current.map((item) => item.id === video.id ? video : item));
      if (selectedId === video.id) {
        setDraft((current) => ({ ...current, enabled: video.enabled }));
      }
      setError(reason instanceof Error ? reason.message : "更新视频启停状态失败");
    } finally {
      setTogglingId(null);
    }
  }

  const previewable = isPreviewableSource(draft.src);
  const busy = saving || reorderingId !== null || togglingId !== null;

  return (
    <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-line/10 p-5 sm:p-6 lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.02em]">首页背景视频</h1>
            <p className="mt-1 text-xs leading-5 text-bone/55">直接勾选需要在首页播放的视频</p>
          </div>
          <span className="rounded-control bg-line/[0.05] px-2 py-1 font-mono text-[11px] text-bone/55">
            {videos.filter((video) => video.enabled).length} / {videos.length}
          </span>
        </div>

        <button
          type="button"
          onClick={startNew}
          disabled={busy}
          className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-gold px-4 text-sm font-medium text-ink active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" strokeWidth={1.8} aria-hidden="true" />
          新增视频
        </button>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {videos.map((video, index) => (
            <div
              key={video.id}
              aria-busy={togglingId === video.id}
              className={`flex min-w-0 items-stretch rounded-control border transition-colors ${selectedId === video.id ? "border-gold bg-gold/[0.08]" : "border-line/10 bg-line/[0.02] hover:border-line/25"}`}
            >
              <label className="grid min-h-11 w-11 shrink-0 cursor-pointer place-items-center border-r border-line/10">
                <input
                  type="checkbox"
                  checked={video.enabled}
                  disabled={busy}
                  onChange={(event) => void toggleEnabled(video, event.target.checked)}
                  aria-label={`${video.enabled ? "停止" : "启用"}${video.name.zh || video.name.en}首页播放`}
                  aria-describedby="hero-video-list-status"
                  className="size-4 accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-wait"
                />
              </label>
              <button type="button" onClick={() => select(video)} disabled={busy} className="min-w-0 flex-1 px-3 py-3 text-left disabled:cursor-not-allowed">
                <span className="flex items-center gap-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-control border border-line/10 text-gold">
                    <Video className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <strong className="truncate text-sm font-medium text-bone">{video.name.zh || video.name.en || "未命名视频"}</strong>
                </span>
                <span className="mt-2 block truncate pl-9 text-xs text-bone/50">{video.name.en || video.src}</span>
                <span className={`mt-2 ml-9 inline-flex rounded-control px-2 py-1 text-[10px] ${video.enabled ? "bg-gold/12 text-gold" : "bg-line/[0.06] text-bone/50"}`}>
                  {video.enabled ? "已启用" : "已停用"}
                </span>
              </button>
              <div className="flex w-10 shrink-0 flex-col border-l border-line/10">
                <button
                  type="button"
                  onClick={() => void move(video.id, -1)}
                  disabled={index === 0 || busy}
                  aria-label={`上移${video.name.zh || video.name.en}`}
                  className="grid min-h-10 flex-1 place-items-center text-bone/50 hover:bg-line/[0.05] hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <ArrowUp className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => void move(video.id, 1)}
                  disabled={index === videos.length - 1 || busy}
                  aria-label={`下移${video.name.zh || video.name.en}`}
                  className="grid min-h-10 flex-1 place-items-center border-t border-line/10 text-bone/50 hover:bg-line/[0.05] hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <ArrowDown className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          {!videos.length ? (
            <p className="rounded-control border border-dashed border-line/15 p-5 text-sm leading-6 text-bone/55">
              还没有背景视频。新增后可配置媒体路径并预览。
            </p>
          ) : null}
        </div>

        <p
          id="hero-video-list-status"
          className={`mt-4 min-h-5 text-xs leading-5 ${error ? "text-red-200" : message ? "text-gold" : "text-bone/55"}`}
          aria-live="polite"
          aria-atomic="true"
          role={error ? "alert" : "status"}
        >
          {togglingId ? "正在保存首页播放设置" : error || message || "勾选后自动保存，首页按列表顺序播放已启用的视频"}
        </p>
      </aside>

      <section className="min-w-0 p-5 sm:p-8 lg:p-10 xl:p-14">
        <form onSubmit={save} className="mx-auto max-w-[920px]">
          <div className="flex flex-col gap-5 border-b border-line/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-gold">{selectedId ? "编辑背景视频" : "新建背景视频"}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                {draft.name.zh || draft.name.en || "未命名视频"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedId ? (
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={busy}
                  className="inline-flex min-h-10 items-center gap-2 rounded-control border border-red-300/20 px-4 text-sm text-red-200 transition-colors hover:bg-red-400/10 disabled:opacity-50"
                >
                  <Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  删除配置
                </button>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-10 items-center gap-2 rounded-control bg-gold px-5 text-sm font-medium text-ink active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              >
                <Save className="size-4" strokeWidth={1.7} aria-hidden="true" />
                {saving ? "保存中" : "保存"}
              </button>
            </div>
          </div>

          <div className="mt-5">
            <AdminStatus message={message} error={error} busyLabel={reorderingId ? "正在更新视频顺序" : undefined} />
          </div>

          <fieldset disabled={busy} className="mt-8 space-y-8">
            <div>
              <h3 className="text-sm font-medium text-bone">管理名称</h3>
              <p className="mt-1 text-xs leading-5 text-bone/50">中文名称必填；英文名称可留空，且名称不会覆盖视频画面。</p>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <AdminField label="中文名称" value={draft.name.zh} onValueChange={(value) => updateName("zh", value)} required placeholder="例如：文旅空间视觉 01" />
                <AdminField label="英文名称" value={draft.name.en} onValueChange={(value) => updateName("en", value)} hint="可留空" placeholder="例如：Cultural Space Visual 01" />
              </div>
            </div>

            <div className="rounded-card border border-line/10 p-5 sm:p-6">
              <h3 className="text-sm font-medium text-bone">媒体文件</h3>
              <p className="mt-1 text-xs leading-5 text-bone/50">
                从公共文件库选择视频；首页背景视频不需要单独设置封面，删除配置不会删除素材文件。
              </p>
              <div className="mt-5">
                <PublicFilePicker
                  label="视频文件"
                  hint="MP4 / WebM / MOV"
                  value={draft.src}
                  accept="video"
                  onSelect={(_url: string, asset: PublicAsset) => {
                    setDraft((current) => ({ ...current, src: `/${asset.path}` }));
                    setPreviewError("");
                  }}
                />
              </div>

              <div className="mt-6 overflow-hidden rounded-control border border-line/10 bg-black">
                {previewable ? (
                  <video
                    key={draft.src}
                    src={withBasePath(draft.src)}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedData={() => setPreviewError("")}
                    onError={() => setPreviewError("无法加载预览，请检查视频路径是否存在")}
                    className="aspect-video w-full bg-black object-contain"
                  >
                    当前浏览器不支持视频预览。
                  </video>
                ) : (
                  <div className="grid aspect-video place-items-center px-6 text-center">
                    <div>
                      <Video className="mx-auto size-8 text-gold/65" strokeWidth={1.2} aria-hidden="true" />
                      <p className="mt-3 text-xs leading-5 text-bone/50">填写有效的站内视频路径后可在此预览</p>
                    </div>
                  </div>
                )}
              </div>
              {previewError ? <p role="alert" className="mt-3 text-xs leading-5 text-red-200">{previewError}</p> : null}
            </div>

            <AdminToggle
              label="在首页启用"
              description="关闭后保留配置和媒体路径，但首页顺序播放时会跳过该视频。"
              checked={draft.enabled}
              onChange={(enabled) => setDraft((current) => ({ ...current, enabled }))}
            />
          </fieldset>
        </form>
      </section>
    </div>
  );
}
