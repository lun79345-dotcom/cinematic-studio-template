"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import { Container } from "@/components/ui/Container";
import { withBasePath } from "@/lib/base-path";
import type { NewsArticleData } from "@/types/news";

export function NewsArticle({ article }: { article: NewsArticleData }) {
  const { locale, copy } = usePreferences();

  return (
    <main className="pb-24 pt-28 sm:pb-32 sm:pt-36">
      <Container>
        <article className="mx-auto max-w-[800px]">
          <Link href="/news" className="inline-flex min-h-11 items-center gap-2 text-sm text-bone/80 transition-colors hover:text-gold">
            <ArrowLeft className="size-4" aria-hidden="true" />{copy.news.backToNews}
          </Link>
          <header className="mb-10 mt-8 border-b border-line/15 pb-10 sm:mb-14">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-bone/75">
              <span>{copy.news.title}</span>
              <time dateTime={article.publishedAt}>{article.publishedAt.replaceAll("-", ".")}</time>
            </div>
            <h1 className="mt-6 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.45] tracking-[-0.02em]">{article.title[locale]}</h1>
          </header>
          <div className="space-y-6 break-words text-base leading-[2] text-bone/85 sm:text-lg">
            {article.blocks.map((block, index) => {
              const caption = article.blocks[index + 1];
              if (block.type === "image") return (
                <figure key={index} className="py-2 sm:py-4">
                  <Image src={withBasePath(block.src)} alt={block.alt[locale]} width={block.width} height={block.height} sizes="(max-width: 864px) calc(100vw - 40px), 800px" className="h-auto w-full rounded-card" />
                  {caption?.type === "caption" && <figcaption className="mt-3 text-center text-sm leading-relaxed text-bone/75">{caption.text[locale]}</figcaption>}
                </figure>
              );
              if (block.type === "lead") return <p key={index} className="max-w-[38em] text-xl leading-relaxed text-bone sm:text-2xl">{block.text[locale]}</p>;
              if (block.type === "quote") return <blockquote key={index} className="border-y border-gold/25 py-7 font-serif text-xl leading-relaxed text-gold sm:py-9 sm:text-2xl"><p>{block.text[locale]}</p></blockquote>;
              if (block.type === "heading") return <h2 key={index} className="pt-6 text-2xl font-semibold leading-relaxed text-bone sm:pt-10 sm:text-3xl">{block.text[locale]}</h2>;
              if (block.type === "caption") return null;
              return <p key={index} className="whitespace-pre-line">{block.text[locale]}</p>;
            })}
          </div>
          <div className="mt-10 sm:mt-14">
            <Image
              src={withBasePath("/images/demo-scene.svg")}
              alt={locale === "zh" ? "Studio Template微信公众号二维码，可在微信搜索“Studio Template”关注" : "studio WeChat account QR code; search for Studio Template in WeChat to follow"}
              width={1080}
              height={396}
              sizes="(max-width: 864px) calc(100vw - 40px), 800px"
              className="h-auto w-full rounded-card"
            />
          </div>
          <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line/15 pt-6">
            <Link href="/news" className="inline-flex min-h-11 items-center gap-2 text-sm text-bone/80 hover:text-gold"><ArrowLeft className="size-4" aria-hidden="true" />{copy.news.backToNews}</Link>
            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-bone/80 hover:text-gold">{copy.news.originalArticle}<ArrowUpRight className="size-4" aria-hidden="true" /></a>
          </footer>
        </article>
      </Container>
    </main>
  );
}
