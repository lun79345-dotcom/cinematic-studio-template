"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { TrainingHeroArtwork } from "@/components/services/TrainingHeroArtwork";
import { TrainingHeroScene } from "@/components/services/TrainingHeroScene";
import { withBasePath } from "@/lib/base-path";
import { directorTeam } from "@/lib/director-team";
import { getPublicCourses } from "@/lib/public-courses";
import type { ServiceNavigationItem } from "@/types/home-content";
import type { PublicCourse } from "@/types/public-course";
import type { ContactSettings } from "@/types/site-settings";

type Locale = "zh" | "en";
type Localized = Record<Locale, string>;

const programs = [] as {label:Localized;title:Localized;description:Localized;facts:Localized[];image:string;imageAlt:Localized;imagePosition:string}[];

const caseStudies = [] as {title:Localized;description:Localized;video:string;poster:string}[];

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

function TrainingCaseVideo({ video, poster, alt }: { video: string; poster: string; alt: string }) {
  const reduced = useReducedMotion();
  const [videoAllowed, setVideoAllowed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData;
    setVideoAllowed(reduced === false && !saveData);
  }, [reduced]);

  return (
    <>
      <Image
        src={withBasePath(poster)}
        alt={alt}
        fill
        sizes="(max-width: 767px) 100vw, 33vw"
        className={`object-cover transition duration-700 group-hover:scale-[1.025] ${videoReady ? "opacity-0" : "opacity-100"}`}
      />
      {videoAllowed ? (
        <video
          src={withBasePath(video)}
          poster={withBasePath(poster)}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          className={`absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.025] ${videoReady ? "opacity-100" : "opacity-0"}`}
        />
      ) : null}
    </>
  );
}

const COURSE_LOGIN_URL = process.env.NEXT_PUBLIC_COURSE_LOGIN_URL || "#training-pricing";
const COURSES_PER_PAGE = 8;
// Temporarily keep the 02 · ACTIVITY + CASES module out of the public page.
const SHOW_ACTIVITY_AND_CASES = false;

const copy = {
  zh: {
    heroEyebrow: "AIGC TRAINING · TEAM ENABLEMENT",
    heroTitle: "把 AI 工具，\n变成可交付的\n影像能力",
    heroBody: "从创意到成片的全流程 AIGC 培训与陪跑服务，让团队更快想、更快做，也更稳定地交付。",
    viewCourse: "查看课程",
    consult: "预约咨询",
    activityEyebrow: "02 · ACTIVITY + CASES",
    activityTitle: "训练发生在真实创作里",
    activityBody: "把学习放进真实目标、真实协作和真实交付中。",
    ongoing: "正在进行",
    casesTitle: "近期案例",
    programsTitle: "三种训练方式",
    learnMore: "了解详情",
    mentorEyebrow: "03 · MENTORS",
    mentorTitle: "导师展示模块 · 示例",
    mentorBody: "用这个模块介绍课程导师。下方资料仅为页面布局示例。",
    selectedWorks: "相关作品",
    pricingEyebrow: "04 · PRICING",
    pricingTitle: "公开课程",
    pricingBody: "课程内容与价格来自课程平台，发布后会自动出现在这里。",
    recommended: "推荐",
    category: "课程分类",
    level: "难度",
    duration: "学习时长",
    lessons: "课节数量",
    free: "免费",
    loading: "正在获取课程…",
    loadError: "课程暂时无法加载，请稍后重试或联系管理员。",
    retry: "重新加载",
    empty: "暂时没有已发布课程。",
    enroll: "立即报名",
    coursePaginationLabel: "课程分页",
    previousPage: "上一页",
    nextPage: "下一页",
    pricingNote: "课程内容与价格以课程平台的最新公开信息为准。",
  },
  en: {
    heroEyebrow: "AIGC TRAINING · TEAM ENABLEMENT",
    heroTitle: "Turn AI tools\ninto production-ready\nfilm capability",
    heroBody: "End-to-end AIGC training and coaching that helps teams think faster, make faster, and deliver with confidence.",
    viewCourse: "Explore programs",
    consult: "Book a consultation",
    activityEyebrow: "02 · ACTIVITY + CASES",
    activityTitle: "Training happens inside real production",
    activityBody: "Learn through real goals, real collaboration, and real delivery.",
    ongoing: "Now enrolling",
    casesTitle: "Recent cases",
    programsTitle: "Three ways to learn",
    learnMore: "View details",
    mentorEyebrow: "03 · MENTORS",
    mentorTitle: "Mentor showcase · example",
    mentorBody: "Use this module to introduce course mentors. The profiles below are layout examples.",
    selectedWorks: "Selected work",
    pricingEyebrow: "04 · PRICING",
    pricingTitle: "Public courses",
    pricingBody: "Published course content and pricing are synced from the course platform.",
    recommended: "Recommended",
    category: "Category",
    level: "Level",
    duration: "Duration",
    lessons: "Lessons",
    free: "Free",
    loading: "Loading courses…",
    loadError: "Courses are temporarily unavailable. Please try again later or contact the administrator.",
    retry: "Try again",
    empty: "No published courses are available yet.",
    enroll: "Enroll now",
    coursePaginationLabel: "Course pagination",
    previousPage: "Previous",
    nextPage: "Next",
    pricingNote: "Course content and pricing reflect the latest public information from the course platform.",
  },
} as const;

function localized(value: Localized, locale: Locale) {
  return value[locale] || value.zh;
}

function formatCoursePrice(priceInCents: number, locale: Locale) {
  if (priceInCents === 0) return copy[locale].free;

  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    currency: "CNY",
    maximumFractionDigits: priceInCents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(priceInCents / 100);
}

function courseCoverUrl(cover: string) {
  return withBasePath(`/api/public-course-cover?src=${encodeURIComponent(cover)}`);
}

function PublicCourseCover({ course }: { course: PublicCourse }) {
  const [failed, setFailed] = useState(false);
  const source = failed ? withBasePath("/images/demo-scene.svg") : courseCoverUrl(course.cover);

  return (
    <Image
      src={source}
      alt={course.title}
      fill
      sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
      className="object-cover transition duration-700 hover:scale-[1.025]"
      onError={() => setFailed(true)}
    />
  );
}

function SectionHeading({ eyebrow, title, body, dark = false }: { eyebrow: string; title: string; body: string; dark?: boolean }) {
  return (
    <Reveal className="max-w-3xl">
      <p className="font-mono text-[0.68rem] font-medium tracking-[0.18em] text-[rgb(var(--training-blue))]">{eyebrow}</p>
      <h2 className={`mt-5 text-balance font-display text-[clamp(2.35rem,5vw,4.75rem)] font-light leading-[1.06] tracking-[-0.035em] ${dark ? "text-white" : "text-[rgb(var(--training-ink))]"}`}>{title}</h2>
      <p className={`mt-5 max-w-2xl text-pretty text-base leading-8 sm:text-lg ${dark ? "text-white/58" : "text-[rgb(var(--training-muted))]"}`}>{body}</p>
    </Reveal>
  );
}

export function AigcTrainingLanding({ services, contact }: { services: ServiceNavigationItem[]; contact: ContactSettings }) {
  const { copy: siteCopy, locale } = usePreferences();
  const reduceMotion = useReducedMotion();
  const [activeProgram, setActiveProgram] = useState(0);
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [coursesState, setCoursesState] = useState<"loading" | "ready" | "error">("loading");
  const [coursesRequest, setCoursesRequest] = useState(0);
  const [coursePage, setCoursePage] = useState(1);
  const courseGridRef = useRef<HTMLDivElement>(null);
  const t = copy[locale];
  const program = programs[activeProgram];
  const coursePageCount = Math.max(1, Math.ceil(courses.length / COURSES_PER_PAGE));
  const coursePageStart = (coursePage - 1) * COURSES_PER_PAGE;
  const visibleCourses = courses.slice(coursePageStart, coursePageStart + COURSES_PER_PAGE);

  useEffect(() => {
    const controller = new AbortController();
    setCoursesState("loading");

    getPublicCourses(controller.signal)
      .then((nextCourses) => {
        setCourses(nextCourses);
        setCoursePage(1);
        setCoursesState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCourses([]);
        setCoursesState("error");
      });

    return () => controller.abort();
  }, [coursesRequest]);

  function changeCoursePage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), coursePageCount);
    if (nextPage === coursePage) return;

    setCoursePage(nextPage);
    window.requestAnimationFrame(() => {
      courseGridRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  return (
    <div className="training-page bg-[rgb(var(--training-canvas))] text-[rgb(var(--training-ink))]">
      <Navbar services={services} tone="training" />
      <main className="min-h-[100dvh]">
        <div className="h-[72px] bg-[rgb(var(--training-canvas))]" aria-hidden="true" />

      <section className="relative isolate overflow-hidden border-b border-[rgb(var(--training-line))] bg-[rgb(var(--training-canvas))]" id="training-home">
        <div className="pointer-events-none absolute inset-0 hidden bg-[rgb(var(--training-dark))] lg:block" aria-hidden="true">
          <TrainingHeroScene reduceMotion={reduceMotion} />

          <div className="absolute inset-0 z-20">
            <TrainingHeroArtwork reduceMotion={reduceMotion} />
          </div>
        </div>

        <Container className="relative z-30 min-h-[610px] lg:flex lg:min-h-[calc(100svh-72px)] lg:!max-w-none lg:items-end lg:!px-[clamp(4rem,6vw,10rem)]">
          <div className={`relative z-10 flex flex-col justify-center py-16 pr-0 sm:py-24 lg:min-h-[760px] lg:justify-end lg:py-0 lg:pb-[clamp(4rem,8vh,7rem)] lg:pr-[clamp(2.5rem,4vw,5rem)] ${locale === "en" ? "lg:w-[min(44%,860px)]" : "lg:w-[min(54%,900px)]"}`}>
            <Reveal>
              <p className="font-mono text-[0.68rem] font-medium tracking-[0.18em] text-[rgb(var(--training-blue))]">{t.heroEyebrow}</p>
              <h1 className={`mt-7 whitespace-pre-line font-display font-light leading-[1.02] tracking-[-0.04em] text-[rgb(var(--training-ink))] ${locale === "en" ? "text-[clamp(3rem,4.4vw,5.25rem)]" : "text-[clamp(3.35rem,6vw,6.25rem)]"}`}>
                {t.heroTitle}
              </h1>
              <p className="mt-7 max-w-[58ch] text-pretty text-base leading-8 text-[rgb(var(--training-muted))] sm:text-lg sm:leading-9">{t.heroBody}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="#training-pricing" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-control bg-[rgb(var(--training-blue))] px-6 text-sm font-medium text-white transition hover:bg-[rgb(var(--training-blue-hover))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--training-blue))] active:scale-[0.98]">
                  {t.viewCourse}<ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Link>
                <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-control border border-[rgb(var(--training-blue)/0.34)] px-6 text-sm font-medium text-[rgb(var(--training-blue))] transition hover:border-[rgb(var(--training-blue))] hover:bg-[rgb(var(--training-blue)/0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--training-blue))]">
                  {t.consult}<ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>

        <div className="relative min-h-[min(76svh,720px)] overflow-hidden bg-[rgb(var(--training-dark))] lg:hidden">
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={reduceMotion ? undefined : { scale: [1.01, 1.035, 1.01] }}
            transition={reduceMotion ? undefined : { duration: 14, ease: "easeInOut", repeat: Infinity }}
          >
            <Image
              src={withBasePath("/images/demo-scene.svg")}
              alt={locale === "zh" ? "老板电器 AIGC 品牌影片画面" : "A frame from the ROBAM AIGC brand film"}
              fill
              priority
              sizes="100vw"
              className="object-cover object-[50%_42%]"
            />
          </motion.div>
        </div>
      </section>

      {SHOW_ACTIVITY_AND_CASES ? (
      <section className="bg-[rgb(var(--training-surface))] py-20 sm:py-28 lg:py-36" id="training-programs">
        <Container>
          <SectionHeading eyebrow={t.activityEyebrow} title={t.activityTitle} body={t.activityBody} />

          <div className="mt-14 grid overflow-hidden rounded-card border border-white/12 bg-[rgb(var(--training-dark))] text-white lg:grid-cols-[0.36fr_0.64fr]">
            <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
              <span className="inline-flex rounded-full bg-[rgb(var(--training-blue))] px-3 py-1 font-mono text-[10px] font-medium tracking-[0.12em] text-white">{t.ongoing}</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={activeProgram} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                  <h3 className="mt-6 font-display text-3xl font-light leading-tight sm:text-4xl">{localized(program.title, locale)}</h3>
                  <p className="mt-5 text-sm leading-7 text-white/58 sm:text-base">{localized(program.description, locale)}</p>
                  <dl className="mt-8 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    {program.facts.map((fact, index) => (
                      <div key={fact.zh}>
                        <dt className="font-mono text-[10px] tracking-[0.14em] text-white/35">0{index + 1}</dt>
                        <dd className="mt-2 text-sm text-white/78">{localized(fact, locale)}</dd>
                      </div>
                    ))}
                  </dl>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative min-h-[360px] sm:min-h-[500px] lg:min-h-[590px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={program.image} initial={reduceMotion ? false : { opacity: 0, scale: 1.015 }} animate={{ opacity: 1, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.45 }} className="absolute inset-0">
                  <Image src={withBasePath(program.image)} alt={localized(program.imageAlt, locale)} fill sizes="(max-width: 1023px) 100vw, 64vw" className="object-cover" style={{ objectPosition: program.imagePosition }} />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(var(--training-dark)/0.62))]" aria-hidden="true" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-end justify-between gap-6">
              <h3 className="font-display text-2xl font-light sm:text-3xl">{t.casesTitle}</h3>
              <Link href="/cases" className="hidden items-center gap-2 text-sm text-[rgb(var(--training-blue))] transition hover:text-[rgb(var(--training-blue-hover))] sm:inline-flex">{locale === "zh" ? "查看全部案例" : "View all cases"}<ArrowRight className="size-4" strokeWidth={1.5} /></Link>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {caseStudies.map((item) => (
                <Link key={item.title.zh} href="/cases" className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--training-blue))]">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-white">
                    <TrainingCaseVideo video={item.video} poster={item.poster} alt={localized(item.title, locale)} />
                  </div>
                  <h4 className="mt-4 text-lg font-medium">{localized(item.title, locale)}</h4>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--training-muted))]">{localized(item.description, locale)}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-16 border-t border-[rgb(var(--training-line))]">
            <h3 className="py-6 font-display text-2xl font-light">{t.programsTitle}</h3>
            {programs.map((item, index) => (
              <button key={item.label.zh} type="button" onClick={() => setActiveProgram(index)} aria-pressed={activeProgram === index} className={`group grid min-h-20 w-full grid-cols-[44px_1fr_auto] items-center gap-3 border-t border-[rgb(var(--training-line))] text-left transition-colors first:border-t-0 sm:grid-cols-[64px_0.45fr_1fr_auto] ${activeProgram === index ? "text-[rgb(var(--training-ink))]" : "text-[rgb(var(--training-muted))] hover:text-[rgb(var(--training-ink))]"}`}>
                <span className={`font-mono text-sm ${activeProgram === index ? "text-[rgb(var(--training-blue))]" : "text-[rgb(var(--training-muted)/0.55)]"}`}>0{index + 1}</span>
                <span className="font-medium">{localized(item.label, locale)}</span>
                <span className="hidden text-sm text-[rgb(var(--training-muted))] sm:block">{localized(item.description, locale)}</span>
                <span className="inline-flex items-center gap-2 text-xs text-[rgb(var(--training-blue))]">{t.learnMore}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} /></span>
              </button>
            ))}
          </div>
        </Container>
      </section>
      ) : null}

      <section id="training-mentors" className="border-b border-[rgb(var(--training-line))] bg-[rgb(var(--training-canvas))] py-20 sm:py-28 lg:py-36">
        <Container>
          <SectionHeading eyebrow={t.mentorEyebrow} title={t.mentorTitle} body={t.mentorBody} />
          <div className="mt-14 border-y border-[rgb(var(--training-line))] lg:grid lg:grid-cols-3 lg:divide-x lg:divide-[rgb(var(--training-line))]">
            {directorTeam.map((mentor, index) => (
              <Reveal key={mentor.key} delay={index * 0.07} className="border-t border-[rgb(var(--training-line))] first:border-t-0 lg:border-t-0">
                <article className="grid min-w-0 gap-7 py-8 sm:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)] sm:items-center sm:gap-10 lg:block lg:px-7 lg:py-0 xl:px-10">
                  <div className="relative aspect-[4/5] min-w-0 overflow-hidden bg-[rgb(var(--training-surface))]">
                    <Image
                      src={withBasePath(mentor.image)}
                      alt={siteCopy.directors.people[mentor.key].imageAlt}
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 42vw, 33vw"
                      className="object-cover"
                      style={{ objectPosition: mentor.imagePosition }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[rgb(var(--training-blue)/0.045)] mix-blend-color" aria-hidden="true" />
                  </div>

                  <div className="min-w-0 pb-1 lg:py-8">
                    <div className="flex min-w-0 items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-balance font-display text-3xl font-light leading-tight text-[rgb(var(--training-ink))]">{siteCopy.directors.people[mentor.key].name}</h3>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-[rgb(var(--training-blue)/0.64)]">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-6 text-[rgb(var(--training-blue))]">{siteCopy.directors.people[mentor.key].role}</p>
                    <p className="mt-5 max-w-[54ch] text-pretty text-sm leading-7 text-[rgb(var(--training-muted))]">{siteCopy.directors.people[mentor.key].description}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[rgb(var(--training-surface))] py-20 sm:py-28 lg:py-36" id="training-pricing">
        <Container>
          <SectionHeading eyebrow={t.pricingEyebrow} title={t.pricingTitle} body={t.pricingBody} />
          {coursesState === "loading" ? (
            <div className="mt-14 rounded-card border border-[rgb(var(--training-line))] bg-white px-6 py-16 text-center text-sm text-[rgb(var(--training-muted))]" role="status">{t.loading}</div>
          ) : null}
          {coursesState === "error" ? (
            <div className="mt-14 rounded-card border border-[rgb(var(--training-line))] bg-white px-6 py-16 text-center" role="alert">
              <p className="text-sm text-[rgb(var(--training-muted))]">{t.loadError}</p>
              <button type="button" onClick={() => setCoursesRequest((request) => request + 1)} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control border border-[rgb(var(--training-blue)/0.3)] px-5 text-sm font-medium text-[rgb(var(--training-blue))] transition hover:border-[rgb(var(--training-blue))] hover:bg-[rgb(var(--training-blue)/0.04)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--training-blue))]">{t.retry}</button>
            </div>
          ) : null}
          {coursesState === "ready" && courses.length === 0 ? (
            <p className="mt-14 rounded-card border border-[rgb(var(--training-line))] bg-white px-6 py-16 text-center text-sm text-[rgb(var(--training-muted))]">{t.empty}</p>
          ) : null}
          {coursesState === "ready" && courses.length > 0 ? (
            <div ref={courseGridRef} className="mt-14 scroll-mt-24">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {visibleCourses.map((course, index) => (
                  <article key={course.id} className={`relative flex min-w-0 flex-col overflow-hidden rounded-card border border-[rgb(var(--training-line))] bg-white ${course.featured ? "shadow-[inset_0_3px_0_rgb(var(--training-blue))]" : ""}`}>
                    <div className="relative aspect-[16/10] overflow-hidden bg-[rgb(var(--training-canvas))]">
                      <PublicCourseCover course={course} />
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
                        <span className="rounded-full bg-white/92 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-[rgb(var(--training-blue))] shadow-sm backdrop-blur-sm">{course.category}</span>
                        {course.featured ? <span className="rounded-full bg-[rgb(var(--training-blue))] px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-white">{t.recommended}</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                      <p className="font-mono text-[10px] tracking-[0.16em] text-[rgb(var(--training-blue))]">{String(coursePageStart + index + 1).padStart(2, "0")}</p>
                      <h3 className="mt-4 text-balance font-display text-2xl font-light leading-tight">{course.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[rgb(var(--training-muted))]">{course.subtitle || course.description}</p>
                      <div className="mt-5 flex items-baseline gap-3">
                        <p className="text-3xl font-medium tracking-[-0.03em] text-[rgb(var(--training-blue))]">{formatCoursePrice(course.price, locale)}</p>
                        {course.originalPrice > course.price ? <p className="text-sm text-[rgb(var(--training-muted)/0.68)] line-through">{formatCoursePrice(course.originalPrice, locale)}</p> : null}
                      </div>
                      {course.outcomes.length > 0 ? (
                        <ul className="mt-6 flex-1 space-y-3 text-sm leading-6 text-[rgb(var(--training-muted))]">
                          {course.outcomes.slice(0, 4).map((outcome) => <li key={outcome} className="flex gap-3"><BadgeCheck className="mt-1 size-4 shrink-0 text-[rgb(var(--training-blue))]" strokeWidth={1.5} aria-hidden="true" /><span>{outcome}</span></li>)}
                        </ul>
                      ) : null}
                      <div className="mt-7 border-t border-[rgb(var(--training-line))] pt-5">
                        <p className="text-xs text-[rgb(var(--training-muted))]">{course.instructorName} · {course.instructorTitle}</p>
                        <a href={COURSE_LOGIN_URL} className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-control px-5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--training-blue))] ${course.featured ? "bg-[rgb(var(--training-blue))] text-white hover:bg-[rgb(var(--training-blue-hover))]" : "border border-[rgb(var(--training-blue)/0.3)] text-[rgb(var(--training-blue))] hover:border-[rgb(var(--training-blue))] hover:bg-[rgb(var(--training-blue)/0.04)]"}`}>
                          {t.enroll}<ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {coursePageCount > 1 ? (
                <nav className="mt-10 flex items-center justify-between gap-4 border-t border-[rgb(var(--training-line))] pt-6" aria-label={t.coursePaginationLabel}>
                  <button
                    type="button"
                    onClick={() => changeCoursePage(coursePage - 1)}
                    disabled={coursePage === 1}
                    className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-[rgb(var(--training-blue))] transition hover:bg-[rgb(var(--training-blue)/0.05)] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    {t.previousPage}
                  </button>
                  <p className="font-mono text-xs tracking-[0.12em] text-[rgb(var(--training-muted))]" aria-live="polite">
                    {String(coursePage).padStart(2, "0")} / {String(coursePageCount).padStart(2, "0")}
                  </p>
                  <button
                    type="button"
                    onClick={() => changeCoursePage(coursePage + 1)}
                    disabled={coursePage === coursePageCount}
                    className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-[rgb(var(--training-blue))] transition hover:bg-[rgb(var(--training-blue)/0.05)] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {t.nextPage}
                    <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </nav>
              ) : null}
            </div>
          ) : null}
          <p className="mt-5 flex items-center gap-2 text-xs text-[rgb(var(--training-muted))]"><Clock3 className="size-3.5" strokeWidth={1.5} aria-hidden="true" />{t.pricingNote}</p>
        </Container>
      </section>

        <Footer settings={contact} services={services} motionAccent="blue" tone="training" />
      </main>
    </div>
  );
}
