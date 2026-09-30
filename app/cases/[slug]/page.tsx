import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { CaseAutoplayVideo } from "@/components/cases/CaseAutoplayVideo";
import { CaseNavbar } from "@/components/cases/CaseNavbar";
import { CaseTitle } from "@/components/cases/CaseTitle";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { getCase, getCases } from "@/lib/cases";
import { getServices } from "@/lib/services";
import { withBasePath } from "@/lib/base-path";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const item = await getCase((await params).slug);
  if (!item) return { title: { absolute: "页面未找到 | Studio Template" }, robots: { index: false, follow: false } };
  return {
    title: `${item.title} | 案例`,
    description: item.summary,
    alternates: { canonical: absoluteSiteUrl(`/cases/${item.slug}`) },
    openGraph: {
      title: item.title,
      description: item.summary,
      url: absoluteSiteUrl(`/cases/${item.slug}`),
      images: [absoluteSiteUrl(item.coverImage)],
    },
  };
}

export default async function CaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [item, allCases, services] = await Promise.all([getCase((await params).slug), getCases(), getServices()]);
  if (!item) notFound();

  const currentIndex = allCases.findIndex((entry) => entry.slug === item.slug);
  const previous = currentIndex > 0 ? allCases[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < allCases.length - 1 ? allCases[currentIndex + 1] : null;

  return (
    <main className="relative isolate min-h-[100dvh] overflow-hidden bg-carbon text-bone">
      <CaseNavbar services={services.map(({ slug, name, description, features, showInNavigation }) => ({ slug, name, description, features, showInNavigation }))} />
      <AuroraBackground variant="layer" className="z-0" aria-hidden="true" />

      <BackgroundBeamsWithCollision className="relative z-[1]">
      <TracingBeam className="relative mx-auto w-full max-w-[1180px]">
      <article className="px-7 pb-24 pt-32 sm:px-10 sm:pt-40 lg:pb-36">
        <div className="mx-auto max-w-[1040px]">
          <Link href="/#cases" className="inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-gold">
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            返回首页案例
          </Link>

          <header className="mt-14 max-w-[900px]">
            <p className="inline-flex rounded-full border border-gold/30 px-3 py-1.5 text-xs font-medium text-gold">{item.category}</p>
            <CaseTitle item={item} />
            <p className="mt-7 max-w-2xl text-lg leading-8 text-bone/68 sm:text-xl">{item.summary}</p>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm text-mist">
              <span>{item.client}</span>
              <span>{item.services.join(" / ")}</span>
            </div>
          </header>

          <div className="relative mt-14 aspect-[16/10] overflow-hidden rounded-card bg-panel sm:mt-16">
            {item.homeMedia?.type === "video" && item.homeMedia.autoPlay ? (
              <CaseAutoplayVideo src={item.homeMedia.src} poster={item.homeMedia.poster || item.coverImage} alt={item.coverAlt} />
            ) : (
              <Image src={withBasePath(item.coverImage)} alt={item.coverAlt} fill priority sizes="(max-width: 1100px) 100vw, 1040px" className="object-cover" />
            )}
          </div>

          <div className="mt-20 max-w-[760px] sm:mt-28">
            {item.sections.map((section, index) => (
              <section key={`${section.heading}-${index}`} className={index ? "mt-24 sm:mt-32" : ""}>
                {section.heading ? <h2 className="font-sans text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">{section.heading}</h2> : null}
                <div className="mt-7 space-y-5 text-[1.06rem] leading-8 text-bone/72">
                  {section.body.split(/\n\s*\n/).filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {section.image ? (
                  <div className="relative mt-12 aspect-[16/10] w-[min(1040px,calc(100vw-2.5rem))] overflow-hidden rounded-card bg-panel sm:mt-16 sm:w-[min(1040px,calc(100vw-4rem))]">
                    <Image src={withBasePath(section.image)} alt={section.imageAlt || section.heading} fill sizes="(max-width: 1100px) 100vw, 1040px" className="object-cover" />
                  </div>
                ) : null}
              </section>
            ))}
          </div>

          {item.gallery.length > 1 ? (
            <div className="mt-24 grid grid-cols-1 gap-5 sm:mt-32 md:grid-cols-2">
              {item.gallery.map((image, index) => (
                <div key={`${image}-${index}`} className={`${index === 0 && item.gallery.length % 2 ? "md:col-span-2 md:aspect-[16/8]" : "aspect-[4/3]"} relative overflow-hidden rounded-card bg-panel`}>
                  <Image src={withBasePath(image)} alt={`${item.title}案例补充画面 ${index + 1}`} fill priority={image === item.coverImage} sizes="(max-width: 768px) 100vw, 52vw" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}

          <nav className="mt-24 grid gap-4 border-t border-gold/18 pt-8 sm:mt-36 sm:grid-cols-2" aria-label="相邻案例">
            {previous ? (
              <Link href={`/cases/${previous.slug}`} className="group rounded-card border border-line/8 bg-panel p-6 transition hover:-translate-y-1 hover:border-gold/35">
                <span className="flex items-center gap-2 text-xs text-mist"><ArrowLeft className="size-4 text-gold" strokeWidth={1.5} /> 上一个案例</span>
                <strong className="mt-4 block text-xl tracking-[-0.025em]">{previous.title}</strong>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/cases/${next.slug}`} className="group rounded-card border border-line/8 bg-panel p-6 text-right transition hover:-translate-y-1 hover:border-gold/35">
                <span className="flex items-center justify-end gap-2 text-xs text-mist">下一个案例 <ArrowRight className="size-4 text-gold" strokeWidth={1.5} /></span>
                <strong className="mt-4 block text-xl tracking-[-0.025em]">{next.title}</strong>
              </Link>
            ) : null}
          </nav>
        </div>
      </article>
      </TracingBeam>
      </BackgroundBeamsWithCollision>
    </main>
  );
}
