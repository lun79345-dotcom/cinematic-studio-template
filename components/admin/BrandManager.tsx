"use client";

import { withBasePath } from "@/lib/base-path";

import Image from "next/image";
import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { AdminField, AdminStatus, AdminToggle } from "@/components/admin/AdminFields";
import { PublicFilePicker, type PublicAsset } from "@/components/admin/PublicFilePicker";
import type { HomeBrand, HomeBrandInput } from "@/types/home-content";

const defaultBrand = (): HomeBrandInput => ({ name: { zh: "", en: "" }, logo: "", visible: true });

function toInput(brand: HomeBrand): HomeBrandInput {
  return { name: { ...brand.name }, logo: brand.logo, visible: brand.visible };
}

type ApiPayload = { error?: string; brand?: HomeBrand; brands?: HomeBrand[] };

async function readPayload(response: Response) {
  return (await response.json().catch(() => ({}))) as ApiPayload | HomeBrand | HomeBrand[];
}

function getError(payload: ApiPayload | HomeBrand | HomeBrand[], fallback: string) {
  return !Array.isArray(payload) && "error" in payload && typeof payload.error === "string" ? payload.error : fallback;
}

function getBrand(payload: ApiPayload | HomeBrand | HomeBrand[]) {
  if (!Array.isArray(payload) && "brand" in payload && payload.brand) return payload.brand;
  if (!Array.isArray(payload) && "id" in payload) return payload as HomeBrand;
  throw new Error("服务器没有返回品牌数据");
}

function getBrands(payload: ApiPayload | HomeBrand | HomeBrand[]) {
  if (Array.isArray(payload)) return payload;
  if ("brands" in payload && Array.isArray(payload.brands)) return payload.brands;
  throw new Error("服务器没有返回品牌列表");
}

export function BrandManager({ initialBrands }: { initialBrands: HomeBrand[] }) {
  const [brands, setBrands] = useState(initialBrands);
  const [selectedId, setSelectedId] = useState<string | null>(initialBrands[0]?.id ?? null);
  const [draft, setDraft] = useState<HomeBrandInput>(initialBrands[0] ? toInput(initialBrands[0]) : defaultBrand());
  const [saving, setSaving] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function clearStatus() { setMessage(""); setError(""); }
  function select(brand: HomeBrand) { setSelectedId(brand.id); setDraft(toInput(brand)); clearStatus(); }
  function startNew() { setSelectedId(null); setDraft(defaultBrand()); clearStatus(); }
  function updateName(language: "zh" | "en", value: string) {
    setDraft((current) => ({ ...current, name: { ...current.name, [language]: value } }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    clearStatus();
    try {
      const response = await fetch(withBasePath(selectedId ? `/api/admin/brands/${encodeURIComponent(selectedId)}` : "/api/admin/brands"), {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(getError(payload, "保存品牌失败"));
      const saved = getBrand(payload);
      setBrands((current) => selectedId ? current.map((brand) => brand.id === selectedId ? saved : brand) : [...current, saved]);
      setSelectedId(saved.id);
      setDraft(toInput(saved));
      setMessage(selectedId ? "品牌信息已更新" : "品牌已添加到列表");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存品牌失败");
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!selectedId) return;
    const current = brands.find((brand) => brand.id === selectedId);
    if (!window.confirm(`确定删除“${current?.name.zh || draft.name.en || "该品牌"}”吗？`)) return;
    setSaving(true);
    clearStatus();
    try {
      const response = await fetch(withBasePath(`/api/admin/brands/${encodeURIComponent(selectedId)}`), { method: "DELETE" });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(getError(payload, "删除品牌失败"));
      const removedIndex = brands.findIndex((brand) => brand.id === selectedId);
      const next = brands.filter((brand) => brand.id !== selectedId);
      setBrands(next);
      const nextSelected = next[Math.min(removedIndex, Math.max(0, next.length - 1))];
      if (nextSelected) select(nextSelected); else startNew();
      setMessage("品牌已删除");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "删除品牌失败");
    } finally { setSaving(false); }
  }

  async function move(id: string, direction: -1 | 1) {
    const index = brands.findIndex((brand) => brand.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= brands.length) return;
    const previous = brands;
    const next = [...brands];
    [next[index], next[target]] = [next[target], next[index]];
    setBrands(next);
    setReorderingId(id);
    clearStatus();
    try {
      const response = await fetch(withBasePath("/api/admin/brands?action=reorder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((brand) => brand.id) }),
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(getError(payload, "更新顺序失败"));
      setBrands(getBrands(payload));
      setMessage("品牌展示顺序已更新");
    } catch (reason) {
      setBrands(previous);
      setError(reason instanceof Error ? reason.message : "更新顺序失败");
    } finally { setReorderingId(null); }
  }

  return (
    <div className="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-line/10 p-5 sm:p-6 lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-start justify-between gap-4">
          <div><h1 className="text-lg font-semibold tracking-[-0.02em]">合作品牌</h1><p className="mt-1 text-xs leading-5 text-bone/55">管理首页真实品牌 Logo 与展示顺序</p></div>
          <span className="rounded-control bg-line/[0.05] px-2 py-1 font-mono text-[11px] text-bone/55">{brands.length}</span>
        </div>
        <button type="button" onClick={startNew} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-gold px-4 text-sm font-medium text-ink active:scale-[0.99]"><Plus className="size-4" strokeWidth={1.8} aria-hidden="true" />新增品牌</button>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {brands.map((brand, index) => (
            <div key={brand.id} className={`flex min-w-0 items-stretch rounded-control border transition-colors ${selectedId === brand.id ? "border-gold bg-gold/[0.08]" : "border-line/10 bg-line/[0.02] hover:border-line/25"}`}>
              <button type="button" onClick={() => select(brand)} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left">
                <span className="relative h-9 w-14 shrink-0 overflow-hidden bg-line/[0.06]">{brand.logo ? <Image src={withBasePath(brand.logo)} alt="" fill sizes="56px" unoptimized className="object-contain p-1" /> : null}</span>
                <span className="min-w-0"><strong className="block truncate text-sm font-medium text-bone">{brand.name.zh || brand.name.en || "未命名品牌"}</strong><span className="mt-1 block truncate text-xs text-bone/50">{brand.name.en || "未填写英文名称"}</span>{!brand.visible ? <span className="mt-2 inline-flex rounded-control bg-line/[0.06] px-2 py-1 text-[10px] text-bone/50">已隐藏</span> : null}</span>
              </button>
              <div className="flex w-10 shrink-0 flex-col border-l border-line/10"><button type="button" onClick={() => void move(brand.id, -1)} disabled={index === 0 || reorderingId !== null} aria-label={`上移${brand.name.zh || brand.name.en}`} className="grid min-h-10 flex-1 place-items-center text-bone/50 hover:bg-line/[0.05] hover:text-gold disabled:opacity-25"><ArrowUp className="size-3.5" aria-hidden="true" /></button><button type="button" onClick={() => void move(brand.id, 1)} disabled={index === brands.length - 1 || reorderingId !== null} aria-label={`下移${brand.name.zh || brand.name.en}`} className="grid min-h-10 flex-1 place-items-center border-t border-line/10 text-bone/50 hover:bg-line/[0.05] hover:text-gold disabled:opacity-25"><ArrowDown className="size-3.5" aria-hidden="true" /></button></div>
            </div>
          ))}
          {!brands.length ? <p className="rounded-control border border-dashed border-line/15 p-5 text-sm leading-6 text-bone/55">还没有真实合作品牌。上传品牌 Logo 后即可在首页展示。</p> : null}
        </div>
      </aside>

      <section className="min-w-0 p-5 sm:p-8 lg:p-10 xl:p-14">
        <form onSubmit={save} className="mx-auto max-w-[920px]">
          <div className="flex flex-col gap-5 border-b border-line/10 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium text-gold">{selectedId ? "编辑品牌" : "新建品牌"}</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{draft.name.zh || draft.name.en || "未命名品牌"}</h2></div><div className="flex flex-wrap gap-2">{selectedId ? <button type="button" onClick={() => void remove()} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-control border border-red-300/20 px-4 text-sm text-red-200 hover:bg-red-400/10 disabled:opacity-50"><Trash2 className="size-4" strokeWidth={1.5} aria-hidden="true" />删除</button> : null}<button type="submit" disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-control bg-gold px-5 text-sm font-medium text-ink active:scale-[0.98] disabled:opacity-60"><Save className="size-4" strokeWidth={1.7} aria-hidden="true" />{saving ? "保存中" : "保存"}</button></div></div>
          <div className="mt-5"><AdminStatus message={message} error={error} busyLabel={reorderingId ? "正在更新品牌顺序" : undefined} /></div>
          <fieldset disabled={saving} className="mt-8 space-y-8">
            <div><h3 className="text-sm font-medium text-bone">品牌名称</h3><p className="mt-1 text-xs leading-5 text-bone/50">中文名称必填；英文名称可留空，英文页面将使用中文名称。</p><div className="mt-5 grid gap-5 md:grid-cols-2"><AdminField label="中文名称" value={draft.name.zh} onValueChange={(value) => updateName("zh", value)} required /><AdminField label="英文名称" value={draft.name.en} onValueChange={(value) => updateName("en", value)} hint="可留空" /></div></div>
            <div className="border-t border-line/10 pt-8"><h3 className="text-sm font-medium text-bone">品牌 Logo</h3><p className="mt-1 text-xs leading-5 text-bone/50">选择或上传透明背景 Logo；首页会在统一画布内完整显示，不会拉伸或裁切。</p>{draft.logo ? <div className="relative mt-5 h-32 w-full overflow-hidden border border-line/10 bg-line/[0.04]"><Image src={withBasePath(draft.logo)} alt={draft.name.zh || draft.name.en || "品牌 Logo 预览"} fill sizes="820px" unoptimized className="object-contain p-5" /></div> : null}<div className="mt-5"><PublicFilePicker value={draft.logo} accept="image" onSelect={(_url: string, asset: PublicAsset) => setDraft((current) => ({ ...current, logo: `/${asset.path}` }))} label="选择品牌 Logo" hint="支持公共文件夹中的图片，也可直接上传新 Logo。" purpose="logo" /></div></div>
            <div className="border-t border-line/10 pt-8"><AdminToggle label="在首页显示" description="关闭后保留品牌资料，但不会出现在首页品牌展示中。" checked={draft.visible} onChange={(visible) => setDraft((current) => ({ ...current, visible }))} /></div>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
