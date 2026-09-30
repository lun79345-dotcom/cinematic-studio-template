"use client";

import { withBasePath } from "@/lib/base-path";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Plus, Save, Trash2, X } from "lucide-react";
import type { CaseInput, CaseSection, CaseStudy } from "@/types/case";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PublicFilePicker, type PublicAsset } from "@/components/admin/PublicFilePicker";

const MAX_HOME_CASES = 20;

function normalizeHomeCaseSlugs(cases: CaseStudy[], slugs: string[]) {
  const publishedSlugs = new Set(cases.filter((item) => item.published).map((item) => item.slug));
  return Array.from(new Set(slugs))
    .filter((slug) => publishedSlugs.has(slug))
    .slice(0, MAX_HOME_CASES);
}

const emptyCase = (): CaseInput => ({
  slug: "",
  title: "",
  category: "",
  summary: "",
  client: "",
  year: String(new Date().getFullYear()),
  services: [],
  coverImage: "",
  coverAlt: "",
  sections: [{ heading: "", body: "" }],
  gallery: [],
  featured: false,
  isSample: false,
  published: false,
});

function toInput(item: CaseStudy): CaseInput {
  return structuredClone({
    slug: item.slug,
    title: item.title,
    category: item.category,
    summary: item.summary,
    client: item.client,
    year: item.year,
    services: item.services,
    coverImage: item.coverImage,
    coverAlt: item.coverAlt,
    homeMedia: item.homeMedia ? { ...item.homeMedia } : undefined,
    sections: item.sections,
    gallery: item.gallery,
    featured: item.featured,
    isSample: item.isSample,
    published: item.published,
  });
}

function Field({ label, value, onChange, required, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-bone/60">{label}{required ? <span className="ml-1 text-gold">*</span> : null}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} className="mt-2 h-11 w-full rounded-control border border-line/12 bg-line/[0.035] px-3 text-sm text-bone outline-none transition-colors placeholder:text-bone/55 focus:border-gold" />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4, placeholder }: { label: string; value: string; onChange: (value: string) => void; rows?: number; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-bone/60">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} placeholder={placeholder} className="mt-2 w-full resize-y rounded-control border border-line/12 bg-line/[0.035] px-3 py-3 text-sm leading-6 text-bone outline-none transition-colors placeholder:text-bone/55 focus:border-gold" />
    </label>
  );
}

export function CaseManager({
  initialCases,
  initialHomeCaseSlugs,
}: {
  initialCases: CaseStudy[];
  initialHomeCaseSlugs: string[];
}) {
  const [cases, setCases] = useState(initialCases);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialCases[0]?.slug ?? null);
  const [draft, setDraft] = useState<CaseInput>(initialCases[0] ? toInput(initialCases[0]) : emptyCase());
  const [homeCaseSlugs, setHomeCaseSlugs] = useState(() => normalizeHomeCaseSlugs(initialCases, initialHomeCaseSlugs));
  const [showOnHome, setShowOnHome] = useState(() => Boolean(initialCases[0] && initialHomeCaseSlugs.includes(initialCases[0].slug)));
  const [saving, setSaving] = useState(false);
  const [reorderingSlug, setReorderingSlug] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const busy = saving || reorderingSlug !== null;

  function select(item: CaseStudy) {
    setSelectedSlug(item.slug);
    setDraft(toInput(item));
    setShowOnHome(homeCaseSlugs.includes(item.slug));
    setMessage("");
    setError("");
  }

  function startNew() {
    setSelectedSlug(null);
    setDraft(emptyCase());
    setShowOnHome(false);
    setMessage("");
    setError("");
  }

  function update<K extends keyof CaseInput>(key: K, value: CaseInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateSection(index: number, value: CaseSection) {
    update("sections", draft.sections.map((section, sectionIndex) => sectionIndex === index ? value : section));
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const currentIsOnHome = selectedSlug ? homeCaseSlugs.includes(selectedSlug) : false;
      if (showOnHome && !currentIsOnHome && homeCaseSlugs.length >= MAX_HOME_CASES) {
        throw new Error(`首页最多展示 ${MAX_HOME_CASES} 个案例，请先取消一个案例`);
      }
      if (showOnHome && !draft.published) {
        throw new Error("发布到首页前，请先勾选“公开案例”");
      }

      const endpoint = selectedSlug ? `/api/admin/cases/${encodeURIComponent(selectedSlug)}` : "/api/admin/cases";
      const response = await fetch(withBasePath(endpoint), {
        method: selectedSlug ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as CaseStudy & { error?: string };
      if (!response.ok) throw new Error(data.error || "保存失败");

      const renamedSlugs = selectedSlug
        ? homeCaseSlugs.map((slug) => slug === selectedSlug ? data.slug : slug)
        : homeCaseSlugs;
      const nextHomeCaseSlugs = showOnHome
        ? Array.from(new Set([...renamedSlugs, data.slug]))
        : renamedSlugs.filter((slug) => slug !== data.slug);
      const homeResponse = await fetch(withBasePath("/api/admin/home-cases"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: nextHomeCaseSlugs }),
      });
      const homeData = (await homeResponse.json()) as { slugs?: string[]; error?: string };
      if (!homeResponse.ok) throw new Error(homeData.error || "首页发布状态保存失败");

      const nextCases = selectedSlug
        ? cases.map((item) => item.slug === selectedSlug ? data : item)
        : [data, ...cases];
      const savedHomeCaseSlugs = normalizeHomeCaseSlugs(nextCases, homeData.slugs ?? nextHomeCaseSlugs);
      setCases(nextCases);
      setHomeCaseSlugs(savedHomeCaseSlugs);
      setSelectedSlug(data.slug);
      setDraft(toInput(data));
      setShowOnHome(savedHomeCaseSlugs.includes(data.slug));
      setMessage(showOnHome ? "案例已保存并发布到首页" : "案例已保存");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selectedSlug || !window.confirm(`确定删除“${draft.title}”吗？此操作无法撤销。`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(withBasePath(`/api/admin/cases/${encodeURIComponent(selectedSlug)}`), { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "删除失败");
      const nextCases = cases.filter((item) => item.slug !== selectedSlug);
      setCases(nextCases);
      setHomeCaseSlugs((current) => current.filter((slug) => slug !== selectedSlug));
      if (nextCases[0]) select(nextCases[0]); else startNew();
      setMessage("案例已删除");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "删除失败");
    } finally {
      setSaving(false);
    }
  }

  async function move(slug: string, direction: -1 | 1) {
    if (busy || !selectedSlug) return;
    const index = cases.findIndex((item) => item.slug === slug);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= cases.length) return;

    const previous = cases;
    const next = [...cases];
    [next[index], next[target]] = [next[target], next[index]];
    setCases(next);
    setReorderingSlug(slug);
    setMessage("");
    setError("");

    try {
      const response = await fetch(withBasePath("/api/admin/cases?action=reorder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: next.map((item) => item.slug) }),
      });
      const payload = (await response.json()) as CaseStudy[] | { error?: string };
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(!Array.isArray(payload) && payload.error ? payload.error : "更新案例顺序失败");
      }
      setCases(payload);
      setMessage("案例顺序已更新，首页将使用相同顺序");
      router.refresh();
    } catch (reason) {
      setCases(previous);
      setError(reason instanceof Error ? reason.message : "更新案例顺序失败");
    } finally {
      setReorderingSlug(null);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-ink text-bone">
      <AdminHeader />

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-line/10 p-5 lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r sm:p-6">
          <button type="button" onClick={startNew} disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-gold px-4 text-sm font-medium text-ink active:scale-[0.99] disabled:cursor-wait disabled:opacity-50"><Plus className="size-4" strokeWidth={1.8} />新建案例</button>
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {cases.map((item, index) => (
              <div key={item.slug} className={`flex min-w-[230px] items-stretch rounded-control border transition-colors lg:min-w-0 ${selectedSlug === item.slug ? "border-gold bg-gold/10" : "border-line/10 hover:border-line/25"}`}>
                <button type="button" onClick={() => select(item)} disabled={busy} className="min-w-0 flex-1 p-4 text-left disabled:cursor-wait disabled:opacity-60">
                  <span className="text-xs text-bone/60">{item.category}</span>
                  <strong className="mt-2 block truncate text-sm">{item.title}</strong>
                  <span className={`mt-3 inline-flex items-center gap-1 text-xs ${homeCaseSlugs.includes(item.slug) ? "text-gold" : "text-bone/60"}`}>
                    {homeCaseSlugs.includes(item.slug) ? <Check className="size-3" strokeWidth={1.8} /> : null}
                    {homeCaseSlugs.includes(item.slug) ? "首页展示" : item.published ? "已公开" : "草稿"}
                  </span>
                </button>
                <div className="flex w-10 shrink-0 flex-col border-l border-line/10">
                  <button type="button" onClick={() => void move(item.slug, -1)} disabled={busy || !selectedSlug || index === 0} aria-label={`上移${item.title}`} className="grid min-h-10 flex-1 place-items-center text-bone/50 transition-colors hover:bg-line/[0.05] hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"><ArrowUp className="size-3.5" aria-hidden="true" /></button>
                  <button type="button" onClick={() => void move(item.slug, 1)} disabled={busy || !selectedSlug || index === cases.length - 1} aria-label={`下移${item.title}`} className="grid min-h-10 flex-1 place-items-center border-t border-line/10 text-bone/50 transition-colors hover:bg-line/[0.05] hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"><ArrowDown className="size-3.5" aria-hidden="true" /></button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0 p-5 sm:p-8 lg:p-10 xl:p-14">
          <div className="mx-auto max-w-[980px]">
            <div className="flex flex-col gap-5 border-b border-line/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs text-gold">{selectedSlug ? "编辑案例" : "新建案例"}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">{draft.title || "未命名案例"}</h1></div>
              <div className="flex flex-wrap gap-2">
                {selectedSlug && draft.published ? <a href={withBasePath(`/cases/${draft.slug}`)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-control border border-line/15 px-4 text-sm text-bone/70 hover:text-bone">预览<ArrowUpRight className="size-4" strokeWidth={1.5} /></a> : null}
                {selectedSlug ? <button type="button" onClick={remove} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-control border border-red-300/20 px-4 text-sm text-red-200 hover:bg-red-400/10 disabled:cursor-wait disabled:opacity-50"><Trash2 className="size-4" strokeWidth={1.5} />删除</button> : null}
                <button type="button" onClick={save} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-control bg-gold px-5 text-sm font-medium text-ink active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"><Save className="size-4" strokeWidth={1.7} />{saving ? "保存中" : "保存"}</button>
              </div>
            </div>

            {message ? <p className="mt-5 rounded-control border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-gold" role="status">{message}</p> : null}
            {error ? <p className="mt-5 rounded-control border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p> : null}

            <div className="mt-9 space-y-10">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="案例标题" value={draft.title} onChange={(value) => update("title", value)} required placeholder="例如：《潮汐之外》" />
                <Field label="链接标识" value={draft.slug} onChange={(value) => update("slug", value)} required placeholder="例如：beyond-the-tide" />
                <Field label="案例分类" value={draft.category} onChange={(value) => update("category", value)} required placeholder="例如：AI 电影" />
                <Field label="客户" value={draft.client} onChange={(value) => update("client", value)} placeholder="客户或项目方" />
                <Field label="服务内容" value={draft.services.join("，")} onChange={(value) => update("services", value.split(/[，,]/).map((item) => item.trim()).filter(Boolean))} placeholder="创意策划，AI 影像，后期制作" />
              </div>
              <TextArea label="案例摘要" value={draft.summary} onChange={(value) => update("summary", value)} rows={3} placeholder="用于首页、案例列表和详情页标题下方。" />

              <div className="rounded-card border border-line/10 p-5 sm:p-6">
                <div>
                  <h2 className="font-medium">封面图</h2>
                  <p className="mt-1 text-xs leading-5 text-bone/60">从公共文件库选择 16:10 或更宽的图片，也可在选择器中上传新素材。</p>
                </div>
                {draft.coverImage ? <div className="relative mt-5 aspect-[16/7] overflow-hidden rounded-control bg-line/5"><Image src={withBasePath(draft.coverImage)} alt="封面预览" fill sizes="(max-width: 1024px) 100vw, 680px" unoptimized className="object-cover" /></div> : null}
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <PublicFilePicker
                    label="封面文件"
                    hint="必选图片"
                    value={draft.coverImage}
                    accept="image"
                    onSelect={(_url: string, asset: PublicAsset) => update("coverImage", `/${asset.path}`)}
                  />
                  <Field label="封面替代文本" value={draft.coverAlt} onChange={(value) => update("coverAlt", value)} placeholder="描述画面内容" />
                </div>
              </div>

              <div className="rounded-card border border-line/10 p-5 sm:p-6">
                <div>
                  <h2 className="font-medium">首页案例媒体</h2>
                  <p className="mt-1 max-w-[70ch] text-xs leading-5 text-bone/60">仅用于首页案例展示。未单独设置时沿用上方封面图；可选择图片或静音循环视频。</p>
                </div>
                <div className="relative mt-5 aspect-[16/7] overflow-hidden rounded-control bg-black/40">
                  {draft.homeMedia?.type === "video" ? (
                    <video
                      key={`${draft.homeMedia.src}-${draft.homeMedia.poster ?? ""}`}
                      src={withBasePath(draft.homeMedia.src)}
                      poster={draft.homeMedia.poster || draft.coverImage ? withBasePath(draft.homeMedia.poster || draft.coverImage) : undefined}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="size-full object-cover"
                    >
                      当前浏览器不支持视频预览。
                    </video>
                  ) : draft.homeMedia?.type === "image" || draft.coverImage ? (
                    <Image
                      src={withBasePath(draft.homeMedia?.type === "image" ? draft.homeMedia.src : draft.coverImage)}
                      alt="首页案例媒体预览"
                      fill
                      sizes="(max-width: 1024px) 100vw, 680px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center px-6 text-center text-xs text-bone/45">请先选择案例封面或首页案例媒体</div>
                  )}
                </div>
                <div className="mt-5">
                  <PublicFilePicker
                    label="首页图片或视频"
                    hint={draft.homeMedia ? "已单独设置，可清空恢复沿用封面" : "当前沿用案例封面"}
                    value={draft.homeMedia?.src ?? ""}
                    accept="both"
                    allowClear
                    onSelect={(_url: string, asset: PublicAsset) => update("homeMedia", asset.path
                      ? asset.kind === "video"
                        ? { type: "video", src: `/${asset.path}` }
                        : { type: "image", src: `/${asset.path}` }
                      : undefined)}
                  />
                </div>
                {draft.homeMedia?.type === "video" ? (
                  <div className="mt-5 space-y-5">
                    <PublicFilePicker
                      label="视频海报（可选）"
                      hint="减少动态效果或视频加载前展示；未设置时沿用案例封面"
                      value={draft.homeMedia.poster ?? ""}
                      accept="image"
                      allowClear
                      onSelect={(_url: string, asset: PublicAsset) => setDraft((current) => current.homeMedia?.type === "video"
                        ? {
                            ...current,
                            homeMedia: {
                              ...current.homeMedia,
                              ...(asset.path ? { poster: `/${asset.path}` } : { poster: undefined }),
                            },
                          }
                        : current)}
                    />
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-line/10 px-3 py-2 transition-colors hover:border-gold/30">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.homeMedia.autoPlay)}
                        onChange={(event) => setDraft((current) => current.homeMedia?.type === "video"
                          ? { ...current, homeMedia: { ...current.homeMedia, autoPlay: event.target.checked } }
                          : current)}
                        className="size-4 shrink-0 accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                      />
                      <span><strong className="block text-sm font-medium">首页自动播放</strong><span className="mt-1 block text-xs leading-5 text-bone/55">静音循环播放；减少动态效果或省流量模式下显示海报</span></span>
                    </label>
                  </div>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between"><div><h2 className="text-lg font-medium">正文段落</h2><p className="mt-1 text-xs text-bone/60">每段可包含标题、正文和一张横幅图片。</p></div><button type="button" onClick={() => update("sections", [...draft.sections, { heading: "", body: "" }])} className="inline-flex items-center gap-2 text-sm text-gold"><Plus className="size-4" strokeWidth={1.7} />添加段落</button></div>
                <div className="mt-5 space-y-5">
                  {draft.sections.map((section, index) => (
                    <div key={index} className="rounded-card border border-line/10 p-5 sm:p-6">
                      <div className="flex items-center justify-between"><span className="text-xs text-bone/60">段落 {index + 1}</span><button type="button" onClick={() => update("sections", draft.sections.filter((_, sectionIndex) => sectionIndex !== index))} disabled={draft.sections.length === 1} className="text-bone/60 hover:text-red-200 disabled:opacity-20" aria-label={`删除段落 ${index + 1}`}><X className="size-4" strokeWidth={1.5} /></button></div>
                      <div className="mt-4 space-y-5">
                        <Field label="段落标题" value={section.heading} onChange={(value) => updateSection(index, { ...section, heading: value })} placeholder="例如：从一句设问开始" />
                        <TextArea label="正文" value={section.body} onChange={(value) => updateSection(index, { ...section, body: value })} rows={6} placeholder="空一行可分成多个自然段。" />
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                          <PublicFilePicker
                            label="段落图片"
                            hint="可选"
                            value={section.image || ""}
                            accept="image"
                            allowClear
                            onSelect={(_url: string, asset: PublicAsset) => updateSection(index, { ...section, image: asset.path ? `/${asset.path}` : undefined })}
                          />
                          <Field label="段落图片替代文本" value={section.imageAlt || ""} onChange={(value) => updateSection(index, { ...section, imageAlt: value })} placeholder="描述画面内容" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-card border border-line/10 p-5 sm:p-6">
                <div>
                  <h2 className="font-medium">画廊图片</h2>
                  <p className="mt-1 text-xs leading-5 text-bone/60">从公共文件库逐张添加；两张以上会在案例详情页显示画廊。</p>
                </div>

                {draft.gallery.length ? (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {draft.gallery.map((image, index) => (
                      <div key={`${image}-${index}`} className="overflow-hidden rounded-control border border-line/10 bg-line/[0.025]">
                        <div className="relative aspect-[16/9] bg-black/30">
                          <Image src={withBasePath(image)} alt={`画廊图片 ${index + 1} 预览`} fill sizes="(max-width: 640px) 100vw, 420px" unoptimized className="object-cover" />
                        </div>
                        <div className="space-y-3 p-3">
                          <PublicFilePicker
                            label={`图片 ${index + 1}`}
                            value={image}
                            accept="image"
                            onSelect={(_url: string, asset: PublicAsset) => update("gallery", draft.gallery.map((item, itemIndex) => itemIndex === index ? `/${asset.path}` : item))}
                          />
                          <button
                            type="button"
                            onClick={() => update("gallery", draft.gallery.filter((_, itemIndex) => itemIndex !== index))}
                            className="inline-flex min-h-9 items-center gap-2 text-xs text-bone/55 transition-colors hover:text-red-200"
                          >
                            <Trash2 className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                            移出画廊
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 rounded-control border border-dashed border-line/15 px-4 py-5 text-center text-xs text-bone/50">尚未添加画廊图片</p>
                )}

                <div className="mt-5 max-w-md">
                  <PublicFilePicker
                    label="添加画廊图片"
                    hint="可重复选择"
                    value=""
                    accept="image"
                    onSelect={(_url: string, asset: PublicAsset) => {
                      const url = `/${asset.path}`;
                      if (!draft.gallery.includes(url)) update("gallery", [...draft.gallery, url]);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-card border border-line/10 p-5 sm:grid-cols-2">
                <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-control px-2 py-2 hover:bg-line/[0.035]">
                  <input type="checkbox" checked={draft.isSample} onChange={(event) => update("isSample", event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold" />
                  <span><strong className="block text-sm font-medium">概念样片</strong><span className="mt-1 block text-xs leading-5 text-bone/55">首页案例卡片显示样片角标</span></span>
                </label>
                <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-control px-2 py-2 transition-colors hover:bg-line/[0.035]">
                  <input
                    type="checkbox"
                    checked={draft.published}
                    onChange={(event) => {
                      update("published", event.target.checked);
                      if (!event.target.checked) setShowOnHome(false);
                    }}
                    className="mt-0.5 size-4 shrink-0 accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  />
                  <span><strong className="block text-sm font-medium">公开案例</strong><span className="mt-1 block text-xs leading-5 text-bone/55">在案例列表和详情页中可访问</span></span>
                </label>
                <label className={`flex min-h-14 items-start gap-3 rounded-control px-2 py-2 transition-colors ${!draft.published || (!showOnHome && !(selectedSlug && homeCaseSlugs.includes(selectedSlug)) && homeCaseSlugs.length >= MAX_HOME_CASES) ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-line/[0.035]"}`}>
                  <input
                    type="checkbox"
                    checked={showOnHome}
                    disabled={!draft.published || (!showOnHome && !(selectedSlug && homeCaseSlugs.includes(selectedSlug)) && homeCaseSlugs.length >= MAX_HOME_CASES)}
                    onChange={(event) => setShowOnHome(event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  />
                  <span><strong className="block text-sm font-medium">发布到首页</strong><span className="mt-1 block text-xs leading-5 text-bone/55">首页案例区展示，最多 {MAX_HOME_CASES} 个</span></span>
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
