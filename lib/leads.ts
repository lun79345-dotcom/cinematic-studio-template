import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { canSendLeadNotification, sendLeadNotification } from "@/lib/lead-notifications";
import type { LeadPayload, StoredLead } from "@/types/lead";

const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");
const projectTypes = new Set(["ai-film", "ai-comics", "short-video", "brand-film", "geo", "platform", "other"]);
const budgets = new Set(["", "under-50k", "50k-150k", "150k-300k", "300k-plus", "discuss"]);
const timelines = new Set(["", "within-1-month", "1-3-months", "3-months-plus", "flexible"]);
let writeQueue: Promise<void> = Promise.resolve();

export class LeadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadValidationError";
  }
}

function text(value: unknown, label: string, maxLength: number, required = false) {
  if (typeof value !== "string") throw new LeadValidationError(`${label}格式无效`);
  const normalized = value.trim();
  if (required && !normalized) throw new LeadValidationError(`请填写${label}`);
  if (normalized.length > maxLength) throw new LeadValidationError(`${label}内容过长`);
  return normalized;
}

function parseLead(input: unknown): LeadPayload {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new LeadValidationError("提交内容格式无效");
  }

  const candidate = input as Record<string, unknown>;
  const payload: LeadPayload = {
    name: text(candidate.name, "姓名", 80, true),
    company: text(candidate.company, "公司或品牌", 120),
    email: text(candidate.email, "邮箱", 160),
    phone: text(candidate.phone, "电话或微信", 80, true),
    projectType: text(candidate.projectType, "项目类型", 40, true),
    budget: text(candidate.budget, "预算范围", 40),
    timeline: text(candidate.timeline, "期望时间", 40),
    message: text(candidate.message, "项目需求", 2000, true),
    consent: candidate.consent === true,
    website: text(candidate.website ?? "", "网址", 200),
  };

  if (payload.website) throw new LeadValidationError("提交失败，请稍后重试");
  if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email)) throw new LeadValidationError("邮箱格式无效");
  if (!projectTypes.has(payload.projectType)) throw new LeadValidationError("请选择有效的项目类型");
  if (!budgets.has(payload.budget)) throw new LeadValidationError("请选择有效的预算范围");
  if (!timelines.has(payload.timeline)) throw new LeadValidationError("请选择有效的期望时间");
  if (!payload.consent) throw new LeadValidationError("请确认同意我们使用这些信息与你沟通");
  return payload;
}

async function readLeads() {
  try {
    const raw = await fs.readFile(LEADS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as StoredLead[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function withWriteLock<T>(operation: () => Promise<T>) {
  const result = writeQueue.then(operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function writeLeads(leads: StoredLead[]) {
  await fs.mkdir(path.dirname(LEADS_FILE), { recursive: true });
  const temporaryFile = `${LEADS_FILE}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
  await fs.rename(temporaryFile, LEADS_FILE);
}

export async function createLead(input: unknown, notificationEmails: string[]) {
  const payload = parseLead(input);
  const persistableLead: Omit<StoredLead, "notificationStatus"> = {
    name: payload.name,
    company: payload.company,
    email: payload.email,
    phone: payload.phone,
    projectType: payload.projectType,
    budget: payload.budget,
    timeline: payload.timeline,
    message: payload.message,
    consent: payload.consent,
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    status: "new" as const,
  };
  const notificationStatus = canSendLeadNotification(notificationEmails) ? "pending" : "not-configured";
  const lead: StoredLead = { ...persistableLead, notificationStatus };

  await withWriteLock(async () => {
    const leads = await readLeads();
    await writeLeads([...leads, lead]);
  });

  if (notificationStatus !== "pending") return lead;

  const finalNotificationStatus = await sendLeadNotification(persistableLead, notificationEmails);
  const updatedLead: StoredLead = { ...lead, notificationStatus: finalNotificationStatus };
  await withWriteLock(async () => {
    const leads = await readLeads();
    await writeLeads(leads.map((item) => item.id === lead.id ? updatedLead : item));
  });
  return updatedLead;
}
