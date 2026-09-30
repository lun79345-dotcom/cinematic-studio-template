import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { heroVideoIds } from "@/lib/hero-videos";
import type { ContactSettings, SiteSettings } from "@/types/site-settings";

const SETTINGS_FILE = path.join(process.cwd(), "data", "site-settings.json");
const validHeroVideoIds = new Set<string>(heroVideoIds);
const defaultLeadNotificationEmails = [] as string[];

const defaultContactSettings: ContactSettings = {
  email: "",
  careersEmail: "",
  phone: "",
  icpNumber: "",
  publicSecurityNumber: "",
  companyName: "",
  companyAddress: "",
  leadNotificationEmails: defaultLeadNotificationEmails,
  wechatQrCode: "",
  xiaohongshuQrCode: "",
  douyinQrCode: "",
};

function normalizedText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeNotificationEmails(value: unknown, legacyValue: unknown) {
  if (Array.isArray(value)) {
    return Array.from(new Set(
      value
        .filter((email): email is string => typeof email === "string")
        .map((email) => email.trim())
        .filter(Boolean),
    ));
  }
  const legacyEmail = normalizedText(legacyValue);
  return legacyEmail ? [legacyEmail] : [...defaultLeadNotificationEmails];
}

function normalizeContact(value: unknown): ContactSettings {
  if (!value || typeof value !== "object") {
    return { ...defaultContactSettings, leadNotificationEmails: [...defaultLeadNotificationEmails] };
  }
  const contact = value as Partial<ContactSettings> & { leadNotificationEmail?: unknown };
  return {
    email: normalizedText(contact.email, defaultContactSettings.email),
    careersEmail: normalizedText(contact.careersEmail, defaultContactSettings.careersEmail),
    phone: normalizedText(contact.phone),
    icpNumber: normalizedText(contact.icpNumber),
    publicSecurityNumber: normalizedText(contact.publicSecurityNumber),
    companyName: normalizedText(contact.companyName),
    companyAddress: normalizedText(contact.companyAddress),
    leadNotificationEmails: normalizeNotificationEmails(contact.leadNotificationEmails, contact.leadNotificationEmail),
    wechatQrCode: normalizedText(contact.wechatQrCode),
    xiaohongshuQrCode: normalizedText(contact.xiaohongshuQrCode),
    douyinQrCode: normalizedText(contact.douyinQrCode),
  };
}

function getDefaultSettings(): SiteSettings {
  return {
    homeVideoIds: [...heroVideoIds],
    contact: { ...defaultContactSettings, leadNotificationEmails: [...defaultLeadNotificationEmails] },
  };
}

function normalizeSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object") return getDefaultSettings();

  const settings = value as Partial<SiteSettings> & { homeVideoEnabled?: unknown };
  if (Array.isArray(settings.homeVideoIds)) {
    return {
      homeVideoIds: Array.from(new Set(
        settings.homeVideoIds.filter(
          (id): id is string => typeof id === "string" && validHeroVideoIds.has(id),
        ),
      )),
      contact: normalizeContact(settings.contact),
    };
  }

  // 兼容旧版总开关：关闭映射为空列表，开启映射为全部视频。
  if (typeof settings.homeVideoEnabled === "boolean") {
    return {
      homeVideoIds: settings.homeVideoEnabled ? [...heroVideoIds] : [],
      contact: normalizeContact(settings.contact),
    };
  }

  return getDefaultSettings();
}

export async function getSiteSettings() {
  noStore();
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf8");
    return normalizeSettings(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return getDefaultSettings();
    throw error;
  }
}

export async function updateSiteSettings(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("设置格式无效");
  const candidate = input as Partial<SiteSettings>;
  if (!Array.isArray(candidate.homeVideoIds)) {
    throw new Error("首页视频设置必须是视频 ID 数组");
  }

  if (!candidate.homeVideoIds.every((id) => typeof id === "string")) {
    throw new Error("首页视频 ID 必须是字符串");
  }

  const unknownIds = Array.from(new Set(candidate.homeVideoIds.filter((id) => !validHeroVideoIds.has(id))));
  if (unknownIds.length) {
    throw new Error(`包含未知的首页视频 ID：${unknownIds.join("、")}`);
  }

  const selectedIds = new Set(candidate.homeVideoIds);
  const contact = normalizeContact(candidate.contact);
  const textFields = [
    contact.email,
    contact.careersEmail,
    contact.phone,
    contact.icpNumber,
    contact.publicSecurityNumber,
    contact.companyName,
    contact.companyAddress,
    contact.wechatQrCode,
    contact.xiaohongshuQrCode,
    contact.douyinQrCode,
  ];
  if (textFields.some((value) => value.length > 500)) {
    throw new Error("联系资料单项不能超过 500 个字符");
  }
  if (contact.leadNotificationEmails.length > 20) {
    throw new Error("留资通知邮箱最多设置 20 个");
  }
  if (contact.email && !/^\S+@\S+\.\S+$/.test(contact.email)) {
    throw new Error("联系邮箱格式无效");
  }
  if (contact.careersEmail && !/^\S+@\S+\.\S+$/.test(contact.careersEmail)) {
    throw new Error("工作机会邮箱格式无效");
  }
  if (contact.leadNotificationEmails.some((email) => email.length > 160 || !/^\S+@\S+\.\S+$/.test(email))) {
    throw new Error("存在格式无效的留资通知邮箱");
  }
  for (const [label, qrCode] of [
    ["微信", contact.wechatQrCode],
    ["小红书", contact.xiaohongshuQrCode],
    ["抖音", contact.douyinQrCode],
  ] as const) {
    if (qrCode && (!qrCode.startsWith("/") || /\.\.|\\|\/\/|[?#%\u0000-\u001f\u007f]/.test(qrCode) || !/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(qrCode))) {
      throw new Error(`${label}二维码必须选择站内公共图片`);
    }
  }
  const settings: SiteSettings = {
    homeVideoIds: heroVideoIds.filter((id) => selectedIds.has(id)),
    contact,
  };
  const temporaryFile = `${SETTINGS_FILE}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  await fs.rename(temporaryFile, SETTINGS_FILE);
  return settings;
}
