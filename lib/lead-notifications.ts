import nodemailer, { type Transporter } from "nodemailer";
import type { StoredLead } from "@/types/lead";

export type LeadNotificationStatus = StoredLead["notificationStatus"];

type PersistedLead = Omit<StoredLead, "notificationStatus">;

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  fromName: string;
};

const projectTypeLabels: Record<string, string> = {
  "ai-film": "AI 电影与品牌影像",
  "ai-comics": "AI 漫剧与动态内容",
  "short-video": "短视频内容",
  "brand-film": "品牌片与企业影像",
  geo: "GEO 内容增长",
  platform: "培训或 AI 平台",
  other: "其他合作",
};

const budgetLabels: Record<string, string> = {
  "under-50k": "5 万以内",
  "50k-150k": "5 万至 15 万",
  "150k-300k": "15 万至 30 万",
  "300k-plus": "30 万以上",
  discuss: "沟通后确定",
};

const timelineLabels: Record<string, string> = {
  "within-1-month": "1 个月内",
  "1-3-months": "1 至 3 个月",
  "3-months-plus": "3 个月以上",
  flexible: "时间可协商",
};

let transporter: Transporter | null = null;
let transporterKey = "";

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function getSmtpConfig(): SmtpConfig | null {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const password = env("SMTP_PASSWORD");
  const from = env("SMTP_FROM") || user;
  const port = Number(env("SMTP_PORT") || "465");
  const secureValue = env("SMTP_SECURE").toLowerCase();
  const secure = secureValue ? secureValue === "true" : port === 465;

  if (!host || !user || !password || !from || !Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  return {
    host,
    port,
    secure,
    user,
    password,
    from,
    fromName: env("SMTP_FROM_NAME") || "Studio Template项目咨询",
  };
}

function getTransporter(config: SmtpConfig) {
  const key = `${config.host}:${config.port}:${config.secure}:${config.user}`;
  if (transporter && transporterKey === key) return transporter;

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  });
  transporterKey = key;
  return transporter;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function headerText(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function display(value: string, labels?: Record<string, string>) {
  if (!value) return "未填写";
  return labels?.[value] || value;
}

function submittedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    dateStyle: "long",
    timeStyle: "medium",
  }).format(new Date(value));
}

function row(label: string, value: string) {
  return `<tr><td style="width:120px;padding:10px 14px;color:#8f897f;vertical-align:top;border-bottom:1px solid #2c2924">${escapeHtml(label)}</td><td style="padding:10px 14px;color:#f3eee4;vertical-align:top;border-bottom:1px solid #2c2924;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`;
}

function buildMessage(lead: PersistedLead) {
  const projectType = display(lead.projectType, projectTypeLabels);
  const fields = [
    ["姓名", lead.name],
    ["公司或品牌", display(lead.company)],
    ["邮箱", display(lead.email)],
    ["电话或微信", display(lead.phone)],
    ["项目类型", projectType],
    ["预算范围", display(lead.budget, budgetLabels)],
    ["期望时间", display(lead.timeline, timelineLabels)],
    ["提交时间", submittedAt(lead.submittedAt)],
    ["项目需求", lead.message],
  ] as const;

  const text = [
    "收到一条新的项目咨询",
    "",
    ...fields.map(([label, value]) => `${label}：${value}`),
    "",
    `留资编号：${lead.id}`,
  ].join("\n");

  const html = `<!doctype html><html lang="zh-CN"><body style="margin:0;background:#0b0a08;color:#f3eee4;font-family:Arial,'Microsoft YaHei',sans-serif"><div style="max-width:680px;margin:0 auto;padding:32px 18px"><div style="padding:28px;background:#11100d;border:1px solid #3b3428;border-radius:14px"><div style="margin-bottom:22px;color:#debd87;font-size:12px;letter-spacing:2px">studio</div><h1 style="margin:0 0 10px;font-size:26px;font-weight:500;line-height:1.3">收到一条新的项目咨询</h1><p style="margin:0 0 24px;color:#aaa297;font-size:14px;line-height:1.7">客户已通过官网留资页面提交信息，可直接回复本邮件联系客户。</p><table role="presentation" style="width:100%;border-collapse:collapse;background:#0b0a08;border:1px solid #2c2924">${fields.map(([label, value]) => row(label, value)).join("")}</table><p style="margin:20px 0 0;color:#706a61;font-size:12px;line-height:1.6">留资编号：${escapeHtml(lead.id)}</p></div></div></body></html>`;

  return {
    subject: `新项目咨询｜${headerText(projectType)}｜${headerText(lead.name)}`,
    text,
    html,
  };
}

function normalizeRecipients(recipients: string[]) {
  return Array.from(new Set(recipients.map((recipient) => recipient.trim()).filter(Boolean)));
}

export function canSendLeadNotification(recipients: string[]) {
  return Boolean(normalizeRecipients(recipients).length && getSmtpConfig());
}

export async function verifyLeadNotificationTransport() {
  const config = getSmtpConfig();
  if (!config) throw new Error("SMTP 环境变量未完整配置");
  await getTransporter(config).verify();
}

export async function sendLeadNotification(
  lead: PersistedLead,
  recipients: string[],
): Promise<Extract<LeadNotificationStatus, "sent" | "partial" | "failed" | "not-configured">> {
  const config = getSmtpConfig();
  const notificationRecipients = normalizeRecipients(recipients);
  if (!notificationRecipients.length || !config) return "not-configured";

  const message = buildMessage(lead);
  const results = await Promise.allSettled(notificationRecipients.map((recipient) => (
    getTransporter(config).sendMail({
      from: { name: config.fromName, address: config.from },
      to: recipient,
      replyTo: lead.email || undefined,
      subject: message.subject,
      text: message.text,
      html: message.html,
    })
  )));
  const sentCount = results.filter((result) => result.status === "fulfilled").length;
  if (sentCount === notificationRecipients.length) return "sent";
  return sentCount > 0 ? "partial" : "failed";
}
