"use client";

import { usePreferences } from "@/components/providers/PreferencesProvider";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { newsItems } from "@/lib/news";
import { withBasePath } from "@/lib/base-path";

const PAGE_SIZE = 6;

export function NewsPage({ requestedPage = 1 }: { requestedPage?: number }) {
  const { copy, locale } = usePreferences();
  const totalPages = Math.max(1, Math.ceil(newsItems.length / PAGE_SIZE));
  const currentPage = Number.isSafeInteger(requestedPage) ? Math.min(totalPages, Math.max(1, requestedPage)) : 1;
  const visibleItems = newsItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageHref = (page: number) => page === 1 ? "/news" : `/news?page=${page}`;
  const controlClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control px-3 text-sm transition-colors hover:bg-panel hover:text-gold";

  return (
    <main id="news" className="min-h-[75svh] pb-24 pt-36 sm:pb-32 sm:pt-44 lg:pt-52">
      <Container>
        <header className="grid gap-6 border-b border-line/15 pb-12 md:grid-cols-2 md:items-end lg:pb-16">
          <h1 className="font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.15] tracking-[-0.03em]">{copy.news.title}</h1>
          <p className="max-w-xl text-base leading-8 text-bone/80 md:justify-self-end lg:text-lg">{copy.news.description}</p>
        </header>
        <ul aria-label={copy.news.title} className="divide-y divide-line/15">
          {visibleItems.map((item) => (
            <li key={item.id} className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-5 py-7 sm:grid-cols-[100px_64px_minmax(0,1fr)] sm:gap-x-8 sm:py-9">
              <p className="col-start-2 mb-2 text-sm tabular-nums text-bone/75 sm:col-start-1 sm:row-start-1 sm:mb-0">
                {locale === "zh"
                  ? `${item.date.year}.${String(item.date.month).padStart(2, "0")}.${String(item.date.day).padStart(2, "0")}`
                  : `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][item.date.month - 1]} ${item.date.day}, ${item.date.year}`}
              </p>
              <Image
                src={withBasePath(`/images/news/${item.id}.png`)}
                alt=""
                width={64}
                height={64}
                sizes="64px"
                className="col-start-1 row-start-1 row-span-2 size-16 object-cover sm:col-start-2 sm:row-span-1"
              />
              <h2 className="col-start-2 text-lg font-medium leading-relaxed sm:col-start-3 sm:row-start-1 sm:text-xl lg:text-2xl">
                <Link href={item.href} className="inline-flex min-h-11 items-center gap-3 transition-colors hover:text-gold">
                  <span>{item.title[locale]}</span><ArrowUpRight className="size-5 shrink-0 text-gold" aria-hidden="true" />
                </Link>
              </h2>
            </li>
          ))}
        </ul>
        {totalPages > 1 && (
          <nav aria-label={copy.news.pagination} className="flex flex-wrap items-center justify-center gap-2 border-t border-line/15 pt-8 sm:gap-3">
            {currentPage > 1 ? (
              <Link href={pageHref(currentPage - 1)} rel="prev" className={controlClass}>{copy.news.previousPage}</Link>
            ) : (
              <span aria-disabled="true" className="inline-flex min-h-11 items-center px-3 text-sm text-bone/50">{copy.news.previousPage}</span>
            )}
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <Link key={page} href={pageHref(page)} aria-current={page === currentPage ? "page" : undefined} aria-label={locale === "zh" ? `第 ${page} 页` : `Page ${page}`} className={`${controlClass} ${page === currentPage ? "bg-gold text-ink" : "text-bone/80"}`}>
                {page}
              </Link>
            ))}
            {currentPage < totalPages ? (
              <Link href={pageHref(currentPage + 1)} rel="next" className={controlClass}>{copy.news.nextPage}</Link>
            ) : (
              <span aria-disabled="true" className="inline-flex min-h-11 items-center px-3 text-sm text-bone/50">{copy.news.nextPage}</span>
            )}
          </nav>
        )}
      </Container>
    </main>
  );
}
