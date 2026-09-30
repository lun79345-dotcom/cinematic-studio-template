"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Container } from "@/components/ui/Container";
// import { DotMatrixText } from "@/components/ui/DotMatrixText";
import { FlowingDashedFrame } from "@/components/ui/FlowingDashedFrame";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import type { ServiceNavigationItem } from "@/types/home-content";
import type { ContactSettings } from "@/types/site-settings";
import { withBasePath } from "@/lib/base-path";


function QrHoverButton({
  label,
  qrCode,
  align = "left",
  placement = "top",
  tone = "default",
}: {
  label: string;
  qrCode: string;
  align?: "left" | "right";
  placement?: "top" | "bottom";
  tone?: "default" | "training";
}) {
  const trainingTone = tone === "training";
  const { locale } = usePreferences();
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!qrCode) return null;

  return (
    <span className="relative inline-flex" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
      <button
        type="button"
        className={`inline-flex min-h-11 items-center gap-1 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${trainingTone ? "text-[rgb(var(--training-muted))] hover:text-[rgb(var(--training-blue))] focus-visible:text-[rgb(var(--training-blue))] focus-visible:outline-[rgb(var(--training-blue))]" : "text-mist hover:text-gold focus-visible:text-gold focus-visible:outline-gold"}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        aria-label={`${label}: ${locale === "zh" ? "显示二维码" : "Show QR code"}`}
      >
        {label}
        <ArrowUpRight className="size-3" strokeWidth={1.5} aria-hidden="true" />
      </button>
      <span
        id={id}
        hidden={!open}
        className={`absolute z-50 w-44 border p-2.5 floating-surface ${trainingTone ? "border-[rgb(var(--training-blue)/0.28)] bg-[rgb(var(--training-canvas))]" : "border-gold/25 bg-ink"} ${placement === "top" ? "bottom-[calc(100%+0.75rem)]" : "top-[calc(100%+0.75rem)]"} ${align === "right" ? "left-0 sm:left-auto sm:right-0" : "left-0"}`}
      >
          <>
            <span className="block aspect-square overflow-hidden bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={withBasePath(qrCode)} alt={`${label} ${locale === "zh" ? "二维码" : "QR code"}`} className="size-full object-contain" />
            </span>
            <span className="mt-2 block text-center text-xs leading-5 text-mist">
              {label}
            </span>
          </>
      </span>
    </span>
  );
}

// 页脚只保留最高频入口，完整能力由服务分组承载。
export function Footer({
  settings,
  services,
  motionAccent = "gold",
  tone = "default",
}: {
  settings: ContactSettings;
  services: ServiceNavigationItem[];
  motionAccent?: "gold" | "blue";
  tone?: "default" | "training";
}) {
  const { copy, locale } = usePreferences();
  const trainingTone = tone === "training";
  const frameColor = motionAccent === "blue" ? "#2563eb" : "#debd87";
  // const matrixBaseColor = motionAccent === "blue" ? "rgba(37, 99, 235, 0.12)" : "rgba(222, 189, 135, 0.12)";
  // const matrixAccentColor = motionAccent === "blue" ? "rgba(96, 165, 250, 0.94)" : "rgba(241, 216, 164, 0.94)";
  const xiaohongshuLabel = locale === "zh" ? "小红书" : "REDnote";
  const douyinLabel = locale === "zh" ? "抖音" : "Douyin";
  const footerServices = services.filter((service) => service.showInNavigation).slice(0, 4).flatMap((service) => {
    const label = service.name[locale] || service.name.zh;
    return [[label, `/services/${service.slug}`] as const];
  });
  const navigationLinks = [[copy.footer.selected, "/#cases"], [copy.footer.inquiry, "/contact"]] as const;

  return (
    <footer id="contact" className={`relative isolate scroll-mt-[72px] ${trainingTone ? "border-t border-[rgb(var(--training-line))] bg-[rgb(var(--training-canvas))] text-[rgb(var(--training-ink))]" : "bg-carbon"}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-px" data-footer-top-flow>
        <FlowingDashedFrame
          sides={["top"]}
          dash={12}
          gap={6}
          duration={1}
          color={frameColor}
          opacity={0.28}
        />
      </div>

      <Container className="relative z-10">
        <div className="relative" data-footer-motion-frame>
          <FlowingDashedFrame
            sides={["right", "left"]}
            dash={12}
            gap={6}
            duration={1}
            color={frameColor}
            opacity={0.28}
            className="z-[3]"
          />

          <div className="grid gap-12 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8 lg:py-14">
            <div className="relative z-20">
              <Link href="/" aria-label={copy.a11y.home}><BrandLogo className="w-[220px] max-w-full" /></Link>
              <p className={`mt-5 max-w-xs text-sm leading-7 ${trainingTone ? "text-[rgb(var(--training-muted))]" : "text-mist"}`}>{copy.footer.tagline}</p>
              {settings.companyName && <p className="mt-5 text-sm text-mist">{settings.companyName}</p>}
              {settings.companyAddress && <address className="mt-2 text-sm not-italic leading-7 text-mist">{settings.companyAddress}</address>}
            </div>
            {[{ title: copy.footer.services, links: footerServices }, { title: copy.footer.navigation, links: navigationLinks }].map((column) => (
              <div key={column.title}>
                <h3 className={`text-sm font-medium ${trainingTone ? "text-[rgb(var(--training-ink))]" : "text-bone"}`}>{column.title}</h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className={`inline-flex items-center gap-1 text-sm transition-colors ${trainingTone ? "text-[rgb(var(--training-muted))] hover:text-[rgb(var(--training-blue))]" : "text-mist hover:text-gold"}`}>
                        {label}<ArrowUpRight className="size-3" strokeWidth={1.5} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="relative z-20">
              <h3 className={`text-sm font-medium ${trainingTone ? "text-[rgb(var(--training-ink))]" : "text-bone"}`}>{copy.footer.contact}</h3>
              <ul className="mt-5 space-y-3 text-sm">
                {settings.email && <li>
                    <Link href={`mailto:${settings.email}`} className={`inline-flex items-center gap-1 transition-colors ${trainingTone ? "text-[rgb(var(--training-muted))] hover:text-[rgb(var(--training-blue))]" : "text-mist hover:text-gold"}`}>
                      {settings.email}<ArrowUpRight className="size-3" strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                </li>}
                {settings.wechatQrCode && <li>
                  <QrHoverButton label={copy.footer.wechat} qrCode={settings.wechatQrCode} placement="top" tone={tone} />
                </li>}
                {settings.careersEmail && <li>
                    <Link href={`mailto:${settings.careersEmail}`} className={`inline-flex items-center gap-1 transition-colors ${trainingTone ? "text-[rgb(var(--training-muted))] hover:text-[rgb(var(--training-blue))]" : "text-mist hover:text-gold"}`}>
                      {copy.footer.careers}<ArrowUpRight className="size-3" strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                </li>}
                {settings.phone && <li>
                    <Link href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className={`inline-flex font-mono text-sm transition-colors ${trainingTone ? "text-[rgb(var(--training-ink))] hover:text-[rgb(var(--training-blue))]" : "text-bone hover:text-gold"}`}>
                      {settings.phone}
                    </Link>
                </li>}
              </ul>
            </div>
          </div>

          <div className={`flex flex-col gap-3 border-t px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 ${trainingTone ? "border-[rgb(var(--training-line))] text-[rgb(var(--training-muted))]" : "border-line/10 text-mist"}`}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <p>© {new Date().getFullYear()} {locale === "zh" ? "Studio Template" : "studio"}. {copy.footer.rights}</p>
              {settings.icpNumber && <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-gold">{settings.icpNumber}</a>}
              {settings.publicSecurityNumber && <span>{settings.publicSecurityNumber}</span>}
            </div>
            <div className="flex gap-5">
              <QrHoverButton label={xiaohongshuLabel} qrCode={settings.xiaohongshuQrCode} align="right" tone={tone} />
              <QrHoverButton label={douyinLabel} qrCode={settings.douyinQrCode} align="right" tone={tone} />
            </div>
          </div>

          {/* 首页底部点阵文字特效暂时关闭，保留代码便于后续恢复。
          <div className="relative" data-footer-matrix>
            <FlowingDashedFrame
              sides={["top"]}
              dash={12}
              gap={6}
              duration={1}
              color={frameColor}
              opacity={0.28}
              className="z-[2]"
            />
            <div className="px-5 py-4 sm:px-10 sm:py-6 lg:px-[60px] lg:py-8">
              <div className="aspect-[4.8/1] w-full">
                <DotMatrixText
                  text="studio"
                  orientation="horizontal"
                  fontFamily='var(--font-playfair), Georgia, "Times New Roman", serif'
                  fontWeight={700}
                  fontScale={0.94}
                  dotSize={4}
                  gap={2}
                  baseColor={matrixBaseColor}
                  accentColor={matrixAccentColor}
                  accentDensity={0.1}
                  speed={900}
                  ariaLabel="studio"
                  className="size-full"
                />
              </div>
            </div>
          </div>
          */}
        </div>
      </Container>
    </footer>
  );
}
