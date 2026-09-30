import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import { PageTransition } from "@/components/providers/PageTransition";
import { PreferencesProvider } from "@/components/providers/PreferencesProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { absoluteSiteUrl, SITE_URL } from "@/lib/site-url";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";

// 使用本地 Geist 保证正文加载稳定，并用 Playfair 形成电影海报式标题对比。
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
const heroDisplay = Noto_Serif_SC({
  weight: "300",
  variable: "--font-hero-display",
  display: "swap",
  preload: false,
});
const chineseSans = Noto_Sans_SC({
  weight: ["400", "500"],
  variable: "--font-noto-sans-sc",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  title: {
    default: "Studio Template | 双语创意工作室模板",
    template: "%s | Studio Template",
  },
  description:
    "可自由定制的双语创意工作室网站模板，包含深浅主题、作品展示、服务详情与内容管理后台。",
  alternates: { canonical: absoluteSiteUrl("/") },
  robots: { index: true, follow: true },
  icons: { icon: [{url:absoluteSiteUrl("/icon.svg"),type:"image/svg+xml"}] },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Studio Template",
    title: "Studio Template | 双语创意工作室模板",
    description: "可自由定制的双语网站模板，包含作品展示、服务详情与内容管理后台。",
    url: absoluteSiteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: process.env.BAIDU_SITE_VERIFICATION
    ? { other: { "baidu-site-verification": process.env.BAIDU_SITE_VERIFICATION } }
    : undefined,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Studio Template",
  url: absoluteSiteUrl("/"),
  description: "双语创意工作室网站模板。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="bg-ink" data-content-size="md" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=window.location.pathname;var n=${JSON.stringify(withBasePath("/news"))};var t=p===n||p.indexOf(n+'/')===0?'light':localStorage.getItem('studio-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}var l=localStorage.getItem('studio-locale');if(l==='en'){document.documentElement.lang='en'}var f=localStorage.getItem('studio-content-font-size');if(f==='sm'||f==='md'||f==='lg'||f==='xl'){document.documentElement.dataset.contentSize=f}}catch(e){}`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${heroDisplay.variable} ${chineseSans.variable} antialiased`}>
        <PreferencesProvider>
          <SmoothScroll>
            <PageTransition>{children}</PageTransition>
          </SmoothScroll>
        </PreferencesProvider>
      </body>
    </html>
  );
}
