"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { Container } from "@/components/ui/Container";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import type { LeadPayload } from "@/types/lead";
import { withBasePath } from "@/lib/base-path";

const initialForm: LeadPayload = {
  name: "",
  company: "",
  email: "",
  phone: "",
  projectType: "",
  budget: "",
  timeline: "",
  message: "",
  consent: false,
  website: "",
};

const pageCopy = {
  zh: {
    heroLabel: "项目咨询",
    heroTitle: "把想法，变成\n值得被看见的作品",
    heroBody: "无论你已有完整脚本，还是只有一个模糊方向，都可以从这里开始。我们先理解目标，再给出可执行的内容路径。",
    heroAlt: "黑色电影摄影棚中，一道金色光门通往充满想象力的影像世界",
    processAlt: "导演工作台上的分镜、镜头和制作资料",
    processTitle: "不需要先把一切想清楚",
    processBody: "一个业务目标、一段故事，甚至一句还没成形的描述，都足以成为开始。我们会与你一起判断创意方向、制作方式和交付边界。",
    steps: [
      ["先判断方向", "确认目标、受众与内容场景"],
      ["再选择方法", "匹配导演、制片与 AI 工作流"],
      ["最后明确交付", "梳理周期、预算与成果标准"],
    ],
    formLabel: "项目简报",
    formTitle: "先说说你想做什么",
    formBody: "填写几个关键信息即可。内容越具体，我们越容易判断合适的创作路径。",
    fields: {
      name: "你的姓名",
      company: "公司或品牌",
      email: "邮箱",
      phone: "电话或微信",
      projectType: "项目类型",
      budget: "预算范围",
      timeline: "期望时间",
      message: "项目需求",
    },
    optional: "选填",
    contactHint: "电话或微信为必填项，方便我们及时与你确认需求；邮箱选填。",
    projectPlaceholder: "请选择项目类型",
    budgetPlaceholder: "暂不确定也可以",
    timelinePlaceholder: "请选择期望时间",
    messagePlaceholder: "可以写下项目目标、面向人群、已有素材、参考方向，或目前最想解决的问题。",
    consent: "我同意Studio Template使用以上信息与我沟通本次需求。",
    privacy: "这些信息只用于本次项目沟通，不会公开展示。",
    submit: "提交项目信息",
    submitting: "正在提交",
    successTitle: "信息已收到",
    successBody: "我们会根据你留下的联系方式，与你确认目标、时间与下一步。",
    submitAnother: "再提交一个项目",
    genericError: "暂时无法提交，请稍后重试。",
    requiredError: "请填写姓名、电话或微信、项目类型和项目需求，并确认信息使用授权。",
    projectOptions: [
      ["ai-film", "AI 电影与品牌影像"],
      ["ai-comics", "AI 漫剧与动态内容"],
      ["short-video", "短视频内容"],
      ["brand-film", "品牌片与企业影像"],
      ["geo", "GEO 内容增长"],
      ["platform", "培训或 AI 平台"],
      ["other", "其他合作"],
    ],
    budgetOptions: [["under-50k", "5 万以内"], ["50k-150k", "5 万至 15 万"], ["150k-300k", "15 万至 30 万"], ["300k-plus", "30 万以上"], ["discuss", "希望沟通后确定"]],
    timelineOptions: [["within-1-month", "1 个月内"], ["1-3-months", "1 至 3 个月"], ["3-months-plus", "3 个月以上"], ["flexible", "时间可协商"]],
  },
  en: {
    heroLabel: "Project Inquiry",
    heroTitle: "Turn ideas into\nwork worth seeing",
    heroBody: "Bring a finished script or just an early direction. We start by understanding the goal, then shape a practical path to production.",
    heroAlt: "A golden portal opening into an imaginative film world inside a dark soundstage",
    processAlt: "Storyboards, lenses, and production references on a director's worktable",
    processTitle: "You do not need every answer yet",
    processBody: "A business goal, a story, or one unfinished sentence is enough to begin. Together, we will clarify the creative direction, production approach, and delivery scope.",
    steps: [
      ["Find the direction", "Clarify the goal, audience, and context"],
      ["Choose the method", "Match direction, production, and AI workflows"],
      ["Define delivery", "Align timing, budget, and quality standards"],
    ],
    formLabel: "Project Brief",
    formTitle: "Tell us what you want to make",
    formBody: "Share a few essentials. The more context you provide, the better we can judge the right creative path.",
    fields: {
      name: "Your name",
      company: "Company or brand",
      email: "Email",
      phone: "Phone or WeChat",
      projectType: "Project type",
      budget: "Budget range",
      timeline: "Preferred timing",
      message: "Project details",
    },
    optional: "Optional",
    contactHint: "Phone or WeChat is required so we can follow up promptly. Email is optional.",
    projectPlaceholder: "Select a project type",
    budgetPlaceholder: "It is fine if this is undecided",
    timelinePlaceholder: "Select your preferred timing",
    messagePlaceholder: "Share the goal, audience, available assets, references, or the most important problem you want to solve.",
    consent: "I agree that studio may use this information to discuss this inquiry with me.",
    privacy: "This information is used only for this project inquiry and is never displayed publicly.",
    submit: "Submit project details",
    submitting: "Submitting",
    successTitle: "Your brief is in",
    successBody: "We will use the contact details you provided to confirm goals, timing, and the next step.",
    submitAnother: "Submit another project",
    genericError: "We could not submit this right now. Please try again shortly.",
    requiredError: "Complete your name, phone or WeChat, project type, project details, and consent.",
    projectOptions: [
      ["ai-film", "AI film and brand imagery"],
      ["ai-comics", "AI comic series and motion content"],
      ["short-video", "Short-form video"],
      ["brand-film", "Brand and corporate film"],
      ["geo", "GEO content growth"],
      ["platform", "Training or AI platform"],
      ["other", "Other collaboration"],
    ],
    budgetOptions: [["under-50k", "Under CNY 50k"], ["50k-150k", "CNY 50k to 150k"], ["150k-300k", "CNY 150k to 300k"], ["300k-plus", "CNY 300k plus"], ["discuss", "Decide after a conversation"]],
    timelineOptions: [["within-1-month", "Within 1 month"], ["1-3-months", "1 to 3 months"], ["3-months-plus", "More than 3 months"], ["flexible", "Flexible"]],
  },
} as const;

const inputClass = "mt-2 min-h-12 w-full rounded-control border border-line/20 bg-ink/55 px-4 text-base text-bone outline-none transition duration-200 placeholder:text-mist/55 hover:border-line/40 focus:border-gold focus:ring-2 focus:ring-gold/15 disabled:cursor-wait disabled:opacity-60";

export function ContactLeadPage() {
  const { locale } = usePreferences();
  const copy = pageCopy[locale];
  const reducedMotion = useReducedMotion();
  const [form, setForm] = useState<LeadPayload>(initialForm);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function update<K extends keyof LeadPayload>(key: K, value: LeadPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (state === "error") {
      setState("idle");
      setError("");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.projectType || !form.message.trim() || !form.consent) {
      setState("error");
      setError(copy.requiredError);
      return;
    }

    setState("submitting");
    setError("");
    try {
      const response = await fetch(withBasePath("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || copy.genericError);
      setState("success");
      setForm(initialForm);
    } catch (reason) {
      setState("error");
      setError(reason instanceof Error ? reason.message : copy.genericError);
    }
  }

  return (
    <main className="bg-ink text-bone">
      <section className="relative overflow-hidden pt-20 lg:min-h-[700px] lg:pt-[72px] xl:min-h-[740px]">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: reducedMotion ? 0 : 0.08, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden lg:block"
          aria-hidden="true"
        >
          <Image
            src={withBasePath("/images/demo-scene.svg")}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-ink/20" />
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
        </motion.div>

        <div className="pointer-events-none absolute inset-0 bg-stage-grid opacity-25 lg:right-1/2" aria-hidden="true" />
        <Container className="relative grid gap-10 pb-12 lg:min-h-[628px] lg:grid-cols-2 lg:items-center lg:gap-0 lg:pb-16 xl:min-h-[668px]">
          <motion.div
            initial={reducedMotion ? false : { opacity: 1, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-[650px] lg:pr-10"
          >
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-gold">{copy.heroLabel}</p>
            <h1 className="mt-5 max-w-full whitespace-normal font-display text-[clamp(3rem,12vw,3.7rem)] leading-[0.98] tracking-[-0.05em] text-bone sm:max-w-[10ch] sm:text-[clamp(4rem,9vw,5.1rem)] lg:max-w-[640px] lg:whitespace-pre-line lg:text-[clamp(3.75rem,4vw,4.75rem)]">
              {copy.heroTitle}
            </h1>
            <p className="mt-7 max-w-[34rem] text-base leading-8 text-mist lg:text-[1.05rem]">{copy.heroBody}</p>
          </motion.div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 1, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reducedMotion ? 0 : 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative min-h-[360px] overflow-hidden rounded-card border border-gold/15 sm:min-h-[500px] lg:hidden"
          >
            <Image
              src={withBasePath("/images/demo-scene.svg")}
              alt={copy.heroAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" aria-hidden="true" />
          </motion.div>
        </Container>
      </section>

      <section id="project-brief" className="scroll-mt-20 border-t border-line/10 bg-carbon py-20 sm:py-24 lg:py-32">
        <Container className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-line/15">
              <Image
                src={withBasePath("/images/demo-scene.svg")}
                alt={copy.processAlt}
                fill
                sizes="(min-width: 1024px) 36vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" aria-hidden="true" />
            </div>
            <h2 className="mt-8 max-w-[14ch] font-display text-4xl leading-[1.05] tracking-[-0.04em] sm:text-5xl">{copy.processTitle}</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-mist sm:text-base">{copy.processBody}</p>
            <ol className="mt-8 space-y-5">
              {copy.steps.map(([title, body], index) => (
                <li key={title} className="grid grid-cols-[2rem_1fr] gap-4 border-t border-line/15 pt-5">
                  <span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span>
                  <span>
                    <strong className="block text-sm font-medium text-bone">{title}</strong>
                    <span className="mt-1 block text-sm leading-6 text-mist">{body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-card border border-line/15 bg-ink/55 p-5 sm:p-8 lg:p-10">
            {state === "success" ? (
              <div className="flex min-h-[640px] flex-col items-start justify-center" role="status" aria-live="polite">
                <span className="grid size-14 place-items-center rounded-full border border-gold/35 bg-gold/10 text-gold">
                  <Check className="size-6" strokeWidth={1.6} aria-hidden="true" />
                </span>
                <h2 className="mt-8 font-display text-5xl leading-none tracking-[-0.04em] sm:text-6xl">{copy.successTitle}</h2>
                <p className="mt-5 max-w-lg text-base leading-8 text-mist">{copy.successBody}</p>
                <button
                  type="button"
                  onClick={() => setState("idle")}
                  className="mt-9 min-h-12 rounded-control border border-gold/35 px-5 text-sm font-medium text-gold transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
                >
                  {copy.submitAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-gold">{copy.formLabel}</p>
                <h2 className="mt-4 font-display text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">{copy.formTitle}</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-mist sm:text-base">{copy.formBody}</p>

                {state === "error" ? (
                  <p className="mt-7 rounded-control border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200" role="alert">{error}</p>
                ) : null}

                <fieldset disabled={state === "submitting"} className="mt-9 grid gap-6 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-bone">
                    {copy.fields.name} <span className="text-gold">*</span>
                    <input className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" required maxLength={80} />
                  </label>
                  <label className="block text-sm font-medium text-bone">
                    <span className="flex justify-between gap-3"><span>{copy.fields.company}</span><span className="font-normal text-mist/60">{copy.optional}</span></span>
                    <input className={inputClass} value={form.company} onChange={(event) => update("company", event.target.value)} autoComplete="organization" maxLength={120} />
                  </label>
                  <label className="block text-sm font-medium text-bone">
                    <span className="flex justify-between gap-3"><span>{copy.fields.email}</span><span className="font-normal text-mist/60">{copy.optional}</span></span>
                    <input className={inputClass} type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" maxLength={160} />
                  </label>
                  <label className="block text-sm font-medium text-bone">
                    {copy.fields.phone} <span className="text-gold">*</span>
                    <input className={inputClass} type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" required maxLength={80} />
                  </label>
                  <p className="-mt-3 text-xs leading-5 text-mist/65 sm:col-span-2">{copy.contactHint}</p>
                  <label className="block text-sm font-medium text-bone">
                    {copy.fields.projectType} <span className="text-gold">*</span>
                    <select className={inputClass} value={form.projectType} onChange={(event) => update("projectType", event.target.value)} required>
                      <option value="">{copy.projectPlaceholder}</option>
                      {copy.projectOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-bone">
                    <span className="flex justify-between gap-3"><span>{copy.fields.budget}</span><span className="font-normal text-mist/60">{copy.optional}</span></span>
                    <select className={inputClass} value={form.budget} onChange={(event) => update("budget", event.target.value)}>
                      <option value="">{copy.budgetPlaceholder}</option>
                      {copy.budgetOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-bone sm:col-span-2">
                    <span className="flex justify-between gap-3"><span>{copy.fields.timeline}</span><span className="font-normal text-mist/60">{copy.optional}</span></span>
                    <select className={inputClass} value={form.timeline} onChange={(event) => update("timeline", event.target.value)}>
                      <option value="">{copy.timelinePlaceholder}</option>
                      {copy.timelineOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-bone sm:col-span-2">
                    {copy.fields.message} <span className="text-gold">*</span>
                    <textarea className={`${inputClass} min-h-40 resize-y py-3 leading-7`} value={form.message} onChange={(event) => update("message", event.target.value)} required maxLength={2000} placeholder={copy.messagePlaceholder} />
                  </label>
                  <label className="sr-only" aria-hidden="true">
                    Website
                    <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} />
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-mist sm:col-span-2">
                    <input type="checkbox" className="mt-1 size-4 shrink-0 accent-[rgb(var(--color-accent))]" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} required />
                    <span>{copy.consent}</span>
                  </label>
                </fieldset>

                <div className="mt-8 flex flex-col gap-4 border-t border-line/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-sm text-xs leading-5 text-mist/65">{copy.privacy}</p>
                  <button
                    type="submit"
                    disabled={state === "submitting"}
                    className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control bg-gold px-6 text-sm font-medium text-ink transition-colors hover:bg-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-65"
                  >
                    {state === "submitting" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" strokeWidth={1.7} aria-hidden="true" /> : null}
                    {state === "submitting" ? copy.submitting : copy.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
