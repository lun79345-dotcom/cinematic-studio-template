"use client";

import Image from "next/image";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Save, Trash2, X } from "lucide-react";
import { AdminField, AdminSelect, AdminStatus, AdminTextArea, AdminToggle } from "@/components/admin/AdminFields";
import { PublicFilePicker, type PublicAsset } from "@/components/admin/PublicFilePicker";
import { withBasePath } from "@/lib/base-path";
import type { HomeService, HomeServiceInput, ServiceSection } from "@/types/home-content";

const iconOptions: Array<{ value: HomeServiceInput["iconKey"]; label: string }> = [
  { value: "film", label: "电影胶片" },
  { value: "book-open", label: "展开书本" },
  { value: "wand-sparkles", label: "创意魔杖" },
  { value: "clapperboard", label: "场记板" },
];

function toInput(service: HomeService): HomeServiceInput {
  return {
    slug: service.slug,
    name: { ...service.name },
    label: { ...service.label },
    description: { ...service.description },
    seoDescription: { zh: service.seoDescription?.zh ?? "", en: service.seoDescription?.en ?? "" },
    features: { zh: [...service.features.zh], en: [...service.features.en] },
    sections: service.sections.map((section) => ({
      heading: { ...section.heading },
      body: { ...section.body },
      ...(section.image ? { image: section.image, imageAlt: section.imageAlt ? { ...section.imageAlt } : undefined } : {}),
    })),
    media: { ...service.media },
    imageAlt: { ...service.imageAlt },
    imagePosition: service.imagePosition,
    iconKey: service.iconKey,
    showOnHome: service.showOnHome,
    showInNavigation: service.showInNavigation,
  };
}

function createDraft(template?: HomeService): HomeServiceInput {
  if (template) {
    return {
      ...toInput(template),
      slug: "",
      name: { zh: "", en: "" },
      label: { zh: "", en: "" },
      description: { zh: "", en: "" },
      seoDescription: { zh: "", en: "" },
      showOnHome: true,
      showInNavigation: true,
    };
  }
  return {
    slug: "",
    name: { zh: "", en: "" },
    label: { zh: "", en: "" },
    description: { zh: "", en: "" },
    features: { zh: [], en: [] },
    sections: [{ heading: { zh: "", en: "" }, body: { zh: "", en: "" } }],
    media: { type: "image", src: "" },
    imageAlt: { zh: "", en: "" },
    imagePosition: "50% 50%",
    iconKey: "film",
    showOnHome: true,
    showInNavigation: true,
  };
}

type ApiPayload = { error?: string; service?: HomeService; services?: HomeService[] };

async function readPayload(response: Response) {
  return (await response.json().catch(() => ({}))) as ApiPayload | HomeService | HomeService[];
}

function getError(payload: ApiPayload | HomeService | HomeService[], fallback: string) {
  return !Array.isArray(payload) && "error" in payload && typeof payload.error === "string" ? payload.error : fallback;
}

function getService(payload: ApiPayload | HomeService | HomeService[]) {
  if (!Array.isArray(payload) && "service" in payload && payload.service) return payload.service;
  if (!Array.isArray(payload) && "id" in payload) return payload as HomeService;
  throw new Error("服务器没有返回服务数据");
}

function getServices(payload: ApiPayload | HomeService | HomeService[]) {
  if (Array.isArray(payload)) return payload;
  if ("services" in payload && Array.isArray(payload.services)) return payload.services;
  throw new Error("服务器没有返回服务列表");
}

function lines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function EditorSection({ title, description, defaultOpen = false, children }: { title: string; description: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group rounded-card border border-line/10 bg-line/[0.018]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 marker:hidden sm:px-6">
        <span>
          <strong className="block text-sm font-medium text-bone">{title}</strong>
          <span className="mt-1 block text-xs leading-5 text-bone/55">{description}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-gold transition-transform duration-200 group-open:rotate-180" strokeWidth={1.6} aria-hidden="true" />
      </summary>
      <div className="border-t border-line/10 px-5 py-6 sm:px-6 sm:py-7">{children}</div>
    </details>
  );
}

export function HomeServiceManager({ initialServices }: { initialServices: HomeService[] }) {
  const first = initialServices[0];
  const initialDraft = first ? toInput(first) : createDraft();
  const [services, setServices] = useState(initialServices);
  const [selectedId, setSelectedId] = useState<string | null>(first?.id ?? null);
  const [creating, setCreating] = useState(!first);
  const [draft, setDraft] = useState<HomeServiceInput>(initialDraft);
  const [baseline, setBaseline] = useState(JSON.stringify(initialDraft));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedService = services.find((service) => service.id === selectedId);
  const dirty = JSON.stringify(draft) !== baseline;
  const busy = saving || deleting || reorderingId !== null;

  useEffect(() => {
    if (!dirty) return;
    let allowNavigation = false;

    function confirmDiscard() {
      return window.confirm("当前服务有未保存的修改，离开后将丢失。仍要离开吗？");
    }

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (allowNavigation) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function guardInternalLink(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      if (destination.origin !== current.origin || (destination.pathname === current.pathname && destination.search === current.search)) return;
      if (!confirmDiscard()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
      allowNavigation = true;
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", guardInternalLink, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", guardInternalLink, true);
    };
  }, [dirty]);

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function loadDraft(next: HomeServiceInput) {
    setDraft(next);
    setBaseline(JSON.stringify(next));
  }

  function select(service: HomeService) {
    if ((!creating && service.id === selectedId) || busy) return;
    if (dirty && !window.confirm("当前服务有未保存的修改，切换后将丢失。仍要切换吗？")) return;
    setCreating(false);
    setSelectedId(service.id);
    loadDraft(toInput(service));
    clearStatus();
  }

  function startCreate() {
    if (busy) return;
    if (dirty && !window.confirm("当前服务有未保存的修改，新建服务后这些修改会丢失。仍要继续吗？")) return;
    const next = createDraft(selectedService);
    setCreating(true);
    setSelectedId(null);
    loadDraft(next);
    clearStatus();
    setMessage(selectedService ? "已复制当前服务的详情与素材作为模板，请先填写新的名称和 slug。" : "请先填写基础信息，再按需完善详情和首页素材。");
  }

  function updateLocalized<K extends "name" | "label" | "description" | "imageAlt">(field: K, language: "zh" | "en", value: string) {
    setDraft((current) => ({ ...current, [field]: { ...current[field], [language]: value } }));
  }

  function updateSection(index: number, value: ServiceSection) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) => sectionIndex === index ? value : section),
    }));
  }

  function validate() {
    if (!draft.slug.trim() || !draft.name.zh.trim() || !draft.label.zh.trim()) {
      return "请先填写 slug、中文服务名和中文场景标签";
    }
    if (!draft.description.zh.trim()) return "请填写中文服务摘要";
    if (!draft.features.zh.length) return "中文能力点至少填写一项，每行一项";
    if (!draft.sections.length || draft.sections.some((section) => !section.body.zh.trim())) return "每个详情段落都需要填写中文正文";
    if (!draft.media.src) return "请选择一张服务图片或视频";
    if (!draft.imageAlt.zh.trim()) return "请填写中文媒体说明";
    return "";
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }
    setSaving(true);
    clearStatus();
    try {
      const endpoint = creating ? "/api/admin/services" : `/api/admin/services/${encodeURIComponent(selectedId ?? "")}`;
      const response = await fetch(withBasePath(endpoint), {
        method: creating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(getError(payload, creating ? "新增服务失败" : "保存服务失败"));
      const saved = getService(payload);
      setServices((current) => creating ? [...current, saved] : current.map((service) => service.id === saved.id ? saved : service));
      setCreating(false);
      setSelectedId(saved.id);
      loadDraft(toInput(saved));
      setMessage(creating ? "服务已创建，导航、详情页和首页设置已同步生效" : "服务内容已更新，导航、详情页和首页设置已同步生效");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存服务失败");
    } finally {
      setSaving(false);
    }
  }

  async function removeSelected() {
    if (!selectedService || busy) return;
    const label = selectedService.name.zh || selectedService.name.en || selectedService.slug;
    if (!window.confirm(`确定删除“${label}”吗？\n\n删除后：首页模块会移除该服务，导航下拉框也不再显示，对应详情链接将失效。此操作无法撤销。`)) return;
    setDeleting(true);
    clearStatus();
    try {
      const response = await fetch(withBasePath(`/api/admin/services/${encodeURIComponent(selectedService.id)}`), { method: "DELETE" });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(getError(payload, "删除服务失败"));
      const index = services.findIndex((service) => service.id === selectedService.id);
      const nextServices = services.filter((service) => service.id !== selectedService.id);
      setServices(nextServices);
      const next = nextServices[index] ?? nextServices[index - 1];
      if (next) {
        setSelectedId(next.id);
        setCreating(false);
        loadDraft(toInput(next));
      } else {
        const empty = createDraft();
        setSelectedId(null);
        setCreating(true);
        loadDraft(empty);
      }
      setMessage(`“${label}”已删除`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "删除服务失败");
    } finally {
      setDeleting(false);
    }
  }

  async function move(id: string, direction: -1 | 1) {
    if (busy || creating) return;
    const index = services.findIndex((service) => service.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= services.length) return;
    const previous = services;
    const next = [...services];
    [next[index], next[target]] = [next[target], next[index]];
    setServices(next);
    setReorderingId(id);
    clearStatus();
    try {
      const response = await fetch(withBasePath("/api/admin/services?action=reorder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((service) => service.id) }),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(getError(payload, "更新顺序失败"));
      setServices(getServices(payload));
      setMessage("服务顺序已更新，首页和导航会使用相同顺序");
    } catch (reason) {
      setServices(previous);
      setError(reason instanceof Error ? reason.message : "更新顺序失败");
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[320px_1fr]">
      <aside data-lenis-prevent className="overscroll-contain border-b border-line/10 p-5 sm:p-6 lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-[-0.02em]">服务管理</h1>
            <p className="mt-1 text-xs leading-5 text-bone/55">新增、排序和选择要编辑的服务</p>
          </div>
          <span className="rounded-control bg-line/[0.05] px-2 py-1 font-mono text-[11px] text-bone/55">{services.length}</span>
        </div>

        <button type="button" onClick={startCreate} disabled={busy} className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control bg-gold px-4 text-sm font-medium text-ink transition-colors hover:bg-accentHover disabled:cursor-wait disabled:opacity-50">
          <Plus className="size-4" strokeWidth={1.7} aria-hidden="true" />新增服务
        </button>

        <div className="mt-4 rounded-control bg-line/[0.035] px-3 py-3 text-xs leading-5 text-bone/60">
          <strong className="block text-bone/80">简单三步</strong>
          <span className="mt-1 block">1. 选择或新增服务　2. 修改常用信息　3. 保存发布</span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {services.map((service, index) => (
            <div key={service.id} className={`flex min-w-0 items-stretch rounded-control border transition-colors ${!creating && selectedId === service.id ? "border-gold bg-gold/[0.08]" : "border-line/10 bg-line/[0.02] hover:border-line/25"}`}>
              <button type="button" onClick={() => select(service)} disabled={busy} className="min-w-0 flex-1 px-3 py-3 text-left disabled:cursor-wait disabled:opacity-60">
                <strong className="block truncate text-sm font-medium text-bone">{service.name.zh || service.name.en || "未命名服务"}</strong>
                <span className="mt-1 block truncate text-xs text-bone/45">/{service.slug}</span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`rounded-control px-2 py-1 text-[10px] ${service.showOnHome ? "bg-gold/10 text-gold" : "bg-line/[0.06] text-bone/45"}`}>{service.showOnHome ? "首页" : "不在首页"}</span>
                  <span className={`rounded-control px-2 py-1 text-[10px] ${service.showInNavigation ? "bg-gold/10 text-gold" : "bg-line/[0.06] text-bone/45"}`}>{service.showInNavigation ? "导航" : "不在导航"}</span>
                </span>
              </button>
              <div className="flex w-10 shrink-0 flex-col border-l border-line/10">
                <button type="button" onClick={() => void move(service.id, -1)} disabled={busy || creating || index === 0} aria-label={`上移${service.name.zh || service.name.en}`} className="grid min-h-10 flex-1 place-items-center text-bone/50 hover:bg-line/[0.05] hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"><ArrowUp className="size-3.5" aria-hidden="true" /></button>
                <button type="button" onClick={() => void move(service.id, 1)} disabled={busy || creating || index === services.length - 1} aria-label={`下移${service.name.zh || service.name.en}`} className="grid min-h-10 flex-1 place-items-center border-t border-line/10 text-bone/50 hover:bg-line/[0.05] hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"><ArrowDown className="size-3.5" aria-hidden="true" /></button>
              </div>
            </div>
          ))}
          {!services.length ? <p className="rounded-control border border-dashed border-line/15 px-4 py-5 text-sm leading-6 text-bone/55">还没有服务。点击“新增服务”开始创建。</p> : null}
        </div>
      </aside>

      <section className="min-w-0 p-5 sm:p-8 lg:p-10 xl:p-14">
        <form onSubmit={save} className="mx-auto max-w-[980px]">
          <div className="flex flex-col gap-5 border-b border-line/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-gold">{creating ? "新建服务" : "编辑服务"}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{draft.name.zh || draft.name.en || "未命名服务"}</h2>
              <p className="mt-2 text-xs leading-5 text-bone/50">常用信息默认展开；详情正文和媒体素材需要时再打开。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!creating && selectedService ? (
                <button type="button" onClick={() => void removeSelected()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-control border border-red-300/20 px-4 text-sm text-red-200 transition-colors hover:bg-red-400/10 disabled:cursor-wait disabled:opacity-50"><Trash2 className="size-4" strokeWidth={1.6} aria-hidden="true" />{deleting ? "删除中" : "删除"}</button>
              ) : null}
              <button type="submit" disabled={busy || !dirty} className="inline-flex min-h-10 items-center gap-2 rounded-control bg-gold px-5 text-sm font-medium text-ink transition-colors hover:bg-accentHover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"><Save className="size-4" strokeWidth={1.7} aria-hidden="true" />{saving ? "保存中" : creating ? "创建并发布" : "保存修改"}</button>
            </div>
          </div>

          <div className="mt-5"><AdminStatus message={message} error={error} busyLabel={reorderingId ? "正在更新服务顺序" : undefined} /></div>

          <fieldset disabled={busy} className="mt-7 space-y-4">
            <EditorSection title="基础信息" description="日常最常修改：名称、标签、摘要和能力点" defaultOpen>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2 md:max-w-md">
                  <AdminField label="服务链接 slug" value={draft.slug} onValueChange={(slug) => setDraft((current) => ({ ...current, slug: slug.toLowerCase().replace(/\s+/g, "-") }))} disabled={!creating} required hint={creating ? "仅限小写字母、数字和连字符，创建后不可修改" : "创建后不可修改"} placeholder="例如：ai-brand-film" />
                </div>
                <AdminField label="中文服务名" value={draft.name.zh} onValueChange={(value) => updateLocalized("name", "zh", value)} required />
                <AdminField label="英文服务名" value={draft.name.en} onValueChange={(value) => updateLocalized("name", "en", value)} hint="可留空，英文页面将显示中文服务名" />
                <AdminField label="中文场景标签" value={draft.label.zh} onValueChange={(value) => updateLocalized("label", "zh", value)} required placeholder="例如：影像叙事" />
                <AdminField label="英文场景标签" value={draft.label.en} onValueChange={(value) => updateLocalized("label", "en", value)} hint="可留空，英文页面将显示中文标签" placeholder="例如：Cinematic Storytelling" />
                <AdminTextArea label="中文服务摘要" value={draft.description.zh} onValueChange={(value) => updateLocalized("description", "zh", value)} required rows={4} hint="用于首页和详情页介绍" />
                <AdminTextArea label="英文服务摘要" value={draft.description.en} onValueChange={(value) => updateLocalized("description", "en", value)} rows={4} hint="可留空，英文页面将显示中文摘要" />
                {(["zh", "en"] as const).map((language) => (
                  <AdminTextArea key={language} label={language === "zh" ? "中文 SEO 描述" : "英文 SEO 描述"} value={draft.seoDescription?.[language] ?? ""} onValueChange={(value) => setDraft((current) => ({ ...current, seoDescription: { zh: current.seoDescription?.zh ?? "", en: current.seoDescription?.en ?? "", [language]: value } }))} rows={3} hint="用于搜索与分享摘要；留空时使用服务摘要" />
                ))}
                <AdminTextArea label="中文能力点" value={draft.features.zh.join("\n")} onValueChange={(value) => setDraft((current) => ({ ...current, features: { ...current.features, zh: lines(value) } }))} required rows={4} hint="每行一项，最多 6 项" placeholder="概念开发与世界观\n镜头生成\n剪辑调色" />
                <AdminTextArea label="英文能力点" value={draft.features.en.join("\n")} onValueChange={(value) => setDraft((current) => ({ ...current, features: { ...current.features, en: lines(value) } }))} rows={4} hint="可留空；填写时每行一项，最多 6 项" placeholder="Concept & World-building\nShot Generation\nEditing & Color" />
              </div>
            </EditorSection>

            <EditorSection title="显示位置与首页素材" description="可分别控制首页服务模块和顶部导航下拉框">
              <div className="grid gap-4 md:grid-cols-2">
                <AdminToggle label="显示在首页服务模块" description="关闭后不出现在首页，但详情页仍可访问。" checked={draft.showOnHome} onChange={(showOnHome) => setDraft((current) => ({ ...current, showOnHome }))} />
                <AdminToggle label="显示在导航下拉框" description="关闭后从顶部“服务”下拉框隐藏，不影响首页和详情页。" checked={draft.showInNavigation} onChange={(showInNavigation) => setDraft((current) => ({ ...current, showInNavigation }))} />
              </div>

              <div className="mt-6 grid max-w-2xl gap-5 md:grid-cols-2">
                <AdminSelect label="首页图标" value={draft.iconKey} onValueChange={(value) => setDraft((current) => ({ ...current, iconKey: value as HomeServiceInput["iconKey"] }))} required>
                  {iconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </AdminSelect>
                <AdminSelect label="媒体类型" value={draft.media.type} onValueChange={(type) => setDraft((current) => type === "video" ? { ...current, media: { type: "video", src: "" } } : { ...current, media: { type: "image", src: "" } })} required>
                  <option value="image">图片</option>
                  <option value="video">视频</option>
                </AdminSelect>
              </div>

              {draft.media.src.startsWith("/") ? (
                <div className="relative mt-5 aspect-[16/7] overflow-hidden rounded-control border border-line/10 bg-black/30">
                  {draft.media.type === "image" ? (
                    <Image src={withBasePath(draft.media.src)} alt={draft.imageAlt.zh || "服务图片预览"} fill sizes="(max-width: 1024px) 100vw, 820px" unoptimized className="object-cover" style={{ objectPosition: draft.imagePosition || "50% 50%" }} />
                  ) : (
                    <video src={withBasePath(draft.media.src)} poster={draft.media.poster ? withBasePath(draft.media.poster) : undefined} controls muted playsInline className="h-full w-full object-cover" style={{ objectPosition: draft.imagePosition || "50% 50%" }} />
                  )}
                </div>
              ) : null}

              <div className="mt-5">
                <PublicFilePicker value={draft.media.src} accept="both" onSelect={(_url: string, asset: PublicAsset) => setDraft((current) => asset.kind === "video" ? { ...current, media: { type: "video", src: `/${asset.path}`, ...(current.media.type === "video" && current.media.poster ? { poster: current.media.poster } : {}) } } : { ...current, media: { type: "image", src: `/${asset.path}` } })} label="选择服务图片或视频" hint="可选择公共文件夹里的现有文件，或直接上传。" />
              </div>

              {draft.media.type === "video" ? (
                <div className="mt-5">
                  <PublicFilePicker value={draft.media.poster ?? ""} accept="image" allowClear onSelect={(_url: string, asset: PublicAsset) => setDraft((current) => current.media.type === "video" ? { ...current, media: { ...current.media, ...(asset.path ? { poster: `/${asset.path}` } : { poster: undefined }) } } : current)} label="选择视频封面（可选）" hint="无动画模式下会优先展示。" />
                </div>
              ) : null}

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <AdminField label="媒体焦点" value={draft.imagePosition} onValueChange={(imagePosition) => setDraft((current) => ({ ...current, imagePosition }))} required hint="例如 50% 50% 表示居中" placeholder="50% 50%" />
                <span className="hidden md:block" aria-hidden="true" />
                <AdminField label="中文媒体说明" value={draft.imageAlt.zh} onValueChange={(value) => updateLocalized("imageAlt", "zh", value)} required />
                <AdminField label="英文媒体说明" value={draft.imageAlt.en} onValueChange={(value) => updateLocalized("imageAlt", "en", value)} hint="可留空，英文页面将使用中文说明" />
              </div>
            </EditorSection>

            <EditorSection title="详情页正文" description="中文正文必填；英文内容可留空并在英文页面回退中文">
              <div className="flex justify-end">
                <button type="button" onClick={() => setDraft((current) => ({ ...current, sections: [...current.sections, { heading: { zh: "", en: "" }, body: { zh: "", en: "" } }] }))} disabled={draft.sections.length >= 12} className="inline-flex min-h-10 items-center gap-2 rounded-control border border-gold/25 px-4 text-sm text-gold transition-colors hover:border-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="size-4" strokeWidth={1.7} aria-hidden="true" />添加段落</button>
              </div>

              <div className="mt-5 space-y-5">
                {draft.sections.map((section, index) => (
                  <div key={index} className="rounded-card border border-line/10 p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-medium text-bone/65">详情段落 {index + 1}</span>
                      <button type="button" onClick={() => setDraft((current) => ({ ...current, sections: current.sections.filter((_, sectionIndex) => sectionIndex !== index) }))} disabled={draft.sections.length === 1} aria-label={`删除详情段落 ${index + 1}`} className="grid size-9 place-items-center rounded-control text-bone/50 transition-colors hover:bg-red-400/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-25"><X className="size-4" strokeWidth={1.5} aria-hidden="true" /></button>
                    </div>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      <AdminField label="中文段落标题" value={section.heading.zh} onValueChange={(value) => updateSection(index, { ...section, heading: { ...section.heading, zh: value } })} placeholder="可选" />
                      <AdminField label="英文段落标题" value={section.heading.en} onValueChange={(value) => updateSection(index, { ...section, heading: { ...section.heading, en: value } })} hint="可留空" placeholder="Optional" />
                      <AdminTextArea label="中文正文" value={section.body.zh} onValueChange={(value) => updateSection(index, { ...section, body: { ...section.body, zh: value } })} required rows={7} placeholder="空一行可分成多个自然段。" />
                      <AdminTextArea label="英文正文" value={section.body.en} onValueChange={(value) => updateSection(index, { ...section, body: { ...section.body, en: value } })} rows={7} hint="可留空，英文页面将显示中文正文" placeholder="Use a blank line between paragraphs." />
                    </div>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <PublicFilePicker label="段落图片" hint="可选" value={section.image ?? ""} accept="image" allowClear onSelect={(_url: string, asset: PublicAsset) => updateSection(index, asset.path ? { ...section, image: `/${asset.path}`, imageAlt: section.imageAlt ?? { zh: "", en: "" } } : { heading: section.heading, body: section.body })} />
                      <div className="grid gap-5">
                        <AdminField label="中文图片说明" value={section.imageAlt?.zh ?? ""} onValueChange={(value) => updateSection(index, { ...section, imageAlt: { zh: value, en: section.imageAlt?.en ?? "" } })} required={Boolean(section.image)} disabled={!section.image} />
                        <AdminField label="英文图片说明" value={section.imageAlt?.en ?? ""} onValueChange={(value) => updateSection(index, { ...section, imageAlt: { zh: section.imageAlt?.zh ?? "", en: value } })} hint={section.image ? "可留空，英文页面将使用中文说明" : undefined} disabled={!section.image} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </EditorSection>
          </fieldset>

          <div className="mt-7 flex flex-col items-start justify-between gap-3 border-t border-line/10 pt-6 sm:flex-row sm:items-center">
            <p className="text-xs leading-5 text-bone/50">保存后立即同步首页、服务详情页和顶部导航。</p>
            <button type="submit" disabled={busy || !dirty} className="inline-flex min-h-10 items-center gap-2 rounded-control bg-gold px-5 text-sm font-medium text-ink transition-colors hover:bg-accentHover disabled:cursor-not-allowed disabled:opacity-45"><Save className="size-4" strokeWidth={1.7} aria-hidden="true" />{saving ? "保存中" : creating ? "创建并发布" : "保存修改"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
