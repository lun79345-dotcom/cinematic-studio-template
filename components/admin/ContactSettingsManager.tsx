"use client";

import { withBasePath } from "@/lib/base-path";

import { Plus, Save, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AdminField, AdminStatus } from "@/components/admin/AdminFields";
import { PublicFilePicker } from "@/components/admin/PublicFilePicker";
import type { ContactSettings, SiteSettings } from "@/types/site-settings";

function getError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
}

export function ContactSettingsManager({ initialSettings }: { initialSettings: SiteSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [draft, setDraft] = useState<ContactSettings>(initialSettings.contact);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update<K extends keyof ContactSettings>(field: K, value: ContactSettings[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  }

  function updateNotificationEmail(index: number, value: string) {
    const emails = [...draft.leadNotificationEmails];
    emails[index] = value;
    update("leadNotificationEmails", emails);
  }

  function addNotificationEmail() {
    if (draft.leadNotificationEmails.length >= 20) return;
    update("leadNotificationEmails", [...draft.leadNotificationEmails, ""]);
  }

  function removeNotificationEmail(index: number) {
    update("leadNotificationEmails", draft.leadNotificationEmails.filter((_, itemIndex) => itemIndex !== index));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(withBasePath("/api/admin/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, contact: draft }),
      });
      const payload = await response.json().catch(() => ({})) as unknown;
      if (!response.ok) throw new Error(getError(payload, "保存联系资料失败"));
      const saved = payload as SiteSettings;
      setSettings(saved);
      setDraft(saved.contact);
      setMessage("联系资料已保存，首页页脚会立即使用新设置");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存联系资料失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-14">
      <form onSubmit={save}>
        <div className="flex flex-col gap-5 border-b border-line/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-gold">首页页脚</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">联系资料</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-bone/55">
              管理联系邮箱、工作机会、公司资料和社交平台二维码。留空的公开资料会自动隐藏。
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-gold px-5 text-sm font-medium text-ink transition-colors hover:bg-accentHover active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            <Save className="size-4" strokeWidth={1.7} aria-hidden="true" />
            {saving ? "保存中" : "保存设置"}
          </button>
        </div>

        <div className="mt-5">
          <AdminStatus message={message} error={error} busyLabel={saving ? "正在保存联系资料" : undefined} />
        </div>

        <fieldset disabled={saving} className="mt-8 space-y-8">
          <section className="rounded-card border border-line/10 bg-line/[0.02] p-5 sm:p-6">
            <h2 className="text-sm font-medium text-bone">基础联系方式</h2>
            <p className="mt-1 text-xs leading-5 text-bone/50">电话号码会直接显示在首页页脚“工作机会”下方。</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <AdminField
                label="联系邮箱"
                type="email"
                value={draft.email}
                onValueChange={(value) => update("email", value)}
                placeholder="hello@example.com"
              />
              <AdminField
                label="工作机会邮箱"
                type="email"
                value={draft.careersEmail}
                onValueChange={(value) => update("careersEmail", value)}
                placeholder="careers@example.com"
              />
              <AdminField
                label="电话号码"
                type="tel"
                value={draft.phone}
                onValueChange={(value) => update("phone", value)}
                placeholder="例如：400 888 8888"
                className="md:col-span-2"
              />
            </div>
          </section>

          <section className="rounded-card border border-line/10 bg-line/[0.02] p-5 sm:p-6">
            <h2 className="text-sm font-medium text-bone">公司与备案资料</h2>
            <p className="mt-1 text-xs leading-5 text-bone/50">仅填写真实资料，留空时不在页脚显示。</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {([
                ["companyName", "公司全称"], ["companyAddress", "公司地址"],
                ["icpNumber", "ICP 备案号"], ["publicSecurityNumber", "公安备案号"],
              ] as const).map(([field, label]) => (
                <AdminField key={field} label={label} value={draft[field]} onValueChange={(value) => update(field, value)} />
              ))}
            </div>
          </section>

          <section className="rounded-card border border-gold/20 bg-gold/[0.035] p-5 sm:p-6">
            <div className="max-w-2xl">
              <h2 className="text-sm font-medium text-bone">留资通知</h2>
              <p className="mt-1 text-xs leading-5 text-bone/50">
                新的官网留资会通过 SMTP 分别发送给列表中的每个邮箱。可随时增加或移除，最多设置 20 个。
              </p>
            </div>
            <div className="mt-5 max-w-2xl space-y-3">
              {draft.leadNotificationEmails.length ? draft.leadNotificationEmails.map((email, index) => (
                <div key={`notification-email-${index}`} className="flex items-end gap-3">
                  <AdminField
                    label={`通知邮箱 ${index + 1}`}
                    type="email"
                    value={email}
                    onValueChange={(value) => updateNotificationEmail(index, value)}
                    placeholder="leads@example.com"
                    hint={index === 0 ? "SMTP 通知" : undefined}
                    className="min-w-0 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeNotificationEmail(index)}
                    aria-label={`移除通知邮箱 ${index + 1}`}
                    className="grid size-11 shrink-0 place-items-center rounded-control border border-line/15 text-bone/55 transition-colors hover:border-red-300/35 hover:bg-red-400/10 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    <Trash2 className="size-4" strokeWidth={1.7} aria-hidden="true" />
                  </button>
                </div>
              )) : (
                <p className="rounded-control border border-dashed border-line/15 px-4 py-5 text-sm leading-6 text-bone/45">
                  当前未设置通知邮箱。客户留资仍会保存，但不会发送邮件通知。
                </p>
              )}
              <button
                type="button"
                onClick={addNotificationEmail}
                disabled={draft.leadNotificationEmails.length >= 20}
                className="inline-flex min-h-10 items-center gap-2 rounded-control border border-gold/25 px-4 text-xs font-medium text-gold transition-colors hover:border-gold hover:bg-gold/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="size-4" strokeWidth={1.7} aria-hidden="true" />
                增加通知邮箱
              </button>
            </div>
          </section>

          <section className="rounded-card border border-line/10 bg-line/[0.02] p-5 sm:p-6">
            <h2 className="text-sm font-medium text-bone">社交平台二维码</h2>
            <p className="mt-1 text-xs leading-5 text-bone/50">
              从公共文件库选择图片。访客点击平台名称查看二维码，再次点击、按 Esc 或离开该控件时关闭。
            </p>
            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <PublicFilePicker
                label="微信咨询二维码"
                hint="建议使用正方形图片"
                value={draft.wechatQrCode}
                accept="image"
                allowClear
                onSelect={(url) => update("wechatQrCode", url)}
              />
              <PublicFilePicker
                label="小红书二维码"
                hint="建议使用正方形图片"
                value={draft.xiaohongshuQrCode}
                accept="image"
                allowClear
                onSelect={(url) => update("xiaohongshuQrCode", url)}
              />
              <PublicFilePicker
                label="抖音二维码"
                hint="建议使用正方形图片"
                value={draft.douyinQrCode}
                accept="image"
                allowClear
                onSelect={(url) => update("douyinQrCode", url)}
              />
            </div>
          </section>
        </fieldset>
      </form>
    </div>
  );
}
