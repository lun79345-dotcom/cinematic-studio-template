"use client";

import { withBasePath } from "@/lib/base-path";

import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseStudy } from "@/types/case";

const MAX_HOME_CASES = 20;

type HomeCaseSelectorProps = {
  cases: CaseStudy[];
  initialSlugs: string[];
};

function normalizeSelection(cases: CaseStudy[], slugs: string[]) {
  const publishedSlugs = new Set(
    cases.filter((item) => item.published).map((item) => item.slug),
  );

  return Array.from(new Set(slugs))
    .filter((slug) => publishedSlugs.has(slug))
    .slice(0, MAX_HOME_CASES);
}

export function HomeCaseSelector({ cases, initialSlugs }: HomeCaseSelectorProps) {
  const initialSelection = useRef(normalizeSelection(cases, initialSlugs));
  const confirmedSelection = useRef(initialSelection.current);
  const [selectedSlugs, setSelectedSlugs] = useState(initialSelection.current);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const next = normalizeSelection(cases, initialSlugs);
    confirmedSelection.current = next;
    setSelectedSlugs(next);
  }, [cases, initialSlugs]);

  const selectedSet = new Set(selectedSlugs);
  const selectedCases = selectedSlugs
    .map((slug) => cases.find((item) => item.slug === slug))
    .filter((item): item is CaseStudy => Boolean(item));
  const availableCases = cases.filter((item) => !selectedSet.has(item.slug));

  async function save(nextSlugs: string[]) {
    const previous = confirmedSelection.current;
    const next = normalizeSelection(cases, nextSlugs);

    setSelectedSlugs(next);
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(withBasePath("/api/admin/home-cases"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: next }),
      });
      const data = (await response.json()) as { slugs?: string[]; error?: string };
      if (!response.ok) throw new Error(data.error || "保存首页案例失败");

      const saved = normalizeSelection(cases, data.slugs ?? next);
      confirmedSelection.current = saved;
      setSelectedSlugs(saved);
      setMessage(`已保存 ${saved.length} / ${MAX_HOME_CASES} 个首页案例`);
      router.refresh();
    } catch (reason) {
      setSelectedSlugs(previous);
      setError(reason instanceof Error ? reason.message : "保存首页案例失败");
    } finally {
      setSaving(false);
    }
  }

  function toggle(slug: string, checked: boolean) {
    if (checked) {
      if (selectedSlugs.length >= MAX_HOME_CASES) {
        setMessage("");
        setError(`首页最多展示 ${MAX_HOME_CASES} 个案例，请先取消一个案例`);
        return;
      }
      void save([...selectedSlugs, slug]);
      return;
    }

    void save(selectedSlugs.filter((item) => item !== slug));
  }

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= selectedSlugs.length) return;

    const next = [...selectedSlugs];
    [next[index], next[destination]] = [next[destination], next[index]];
    void save(next);
  }

  return (
    <fieldset
      disabled={saving}
      aria-busy={saving}
      className="rounded-control border border-gold/20 bg-gold/[0.055] p-4 disabled:opacity-75"
    >
      <legend className="px-1 text-xs font-medium text-gold">首页案例席位</legend>

      <div className="flex min-h-7 items-center justify-between gap-3">
        <p className="text-xs text-bone/65">
          已选择 {selectedSlugs.length} / {MAX_HOME_CASES}
        </p>
        {saving ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-bone/60">
            <Loader2 className="size-3.5 animate-spin" strokeWidth={1.7} aria-hidden="true" />
            保存中
          </span>
        ) : null}
      </div>

      {selectedCases.length ? (
        <ol className="mt-3 space-y-1.5" aria-label="已选择的首页案例及顺序">
          {selectedCases.map((item, index) => (
            <li
              key={item.slug}
              className="grid min-h-12 grid-cols-[1rem_1.5rem_minmax(0,1fr)_auto] items-center gap-2 rounded-control border border-gold/20 bg-gold/[0.075] px-2 py-1.5"
            >
              <input
                type="checkbox"
                checked
                onChange={(event) => toggle(item.slug, event.target.checked)}
                aria-label={`从首页取消${item.title}`}
                aria-describedby="home-case-selector-status"
                className="size-4 shrink-0 accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              />
              <span className="font-mono text-[10px] text-gold" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-xs font-medium text-bone">{item.title}</strong>
                <span className="mt-0.5 block truncate text-[10px] text-bone/55">{item.category}</span>
              </span>
              <span className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={saving || index === 0}
                  className="grid size-9 place-items-center rounded-control text-bone/60 transition-colors hover:bg-line/[0.055] hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"
                  aria-label={`将${item.title}上移`}
                >
                  <ArrowUp className="size-3.5" strokeWidth={1.6} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={saving || index === selectedCases.length - 1}
                  className="grid size-9 place-items-center rounded-control text-bone/60 transition-colors hover:bg-line/[0.055] hover:text-gold disabled:cursor-not-allowed disabled:opacity-25"
                  aria-label={`将${item.title}下移`}
                >
                  <ArrowDown className="size-3.5" strokeWidth={1.6} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 rounded-control border border-dashed border-line/12 px-3 py-3 text-xs leading-5 text-bone/55">
          暂未选择，首页案例模块将不展示案例卡片。
        </p>
      )}

      <div className="my-4 h-px bg-line/10" />

      <div className="max-h-56 space-y-1 overflow-y-auto pr-1" aria-label="可选择的案例">
        {availableCases.length ? availableCases.map((item) => {
          const atCapacity = selectedSlugs.length >= MAX_HOME_CASES;
          const disabled = saving || !item.published || atCapacity;

          return (
            <label
              key={item.slug}
              className={`flex min-h-11 items-start gap-3 rounded-control px-2.5 py-2 transition-colors ${
                disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:bg-line/[0.035]"
              }`}
            >
              <input
                type="checkbox"
                checked={false}
                disabled={disabled}
                onChange={(event) => toggle(item.slug, event.target.checked)}
                aria-describedby="home-case-selector-status"
                className="mt-0.5 size-4 shrink-0 accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs font-medium leading-5 text-bone">{item.title}</strong>
                <span className="block truncate text-[10px] leading-4 text-bone/55">
                  {item.published ? item.category : "草稿 · 发布后可选择"}
                </span>
              </span>
            </label>
          );
        }) : (
          <p className="px-2 py-2 text-xs text-bone/55">没有更多可选案例</p>
        )}
      </div>

      <p
        id="home-case-selector-status"
        className={`mt-3 min-h-5 text-xs leading-5 ${error ? "text-red-200" : message ? "text-gold" : "text-bone/55"}`}
        aria-live="polite"
        aria-atomic="true"
        role={error ? "alert" : "status"}
      >
        {error || message || "仅已发布案例可进入首页，顺序将自动保存"}
      </p>

      <span className="sr-only" aria-live="polite">
        {saving ? "正在保存首页案例" : ""}
      </span>
    </fieldset>
  );
}
