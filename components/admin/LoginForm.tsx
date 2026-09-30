"use client";

import { withBasePath } from "@/lib/base-path";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(withBasePath("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "登录失败");
      router.replace("/admin/cases");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-10">
      <label htmlFor="password" className="block text-sm text-bone/70">管理口令</label>
      <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="mt-2 h-12 w-full rounded-control border border-line/15 bg-line/5 px-4 text-bone outline-none transition-colors placeholder:text-bone/55 focus:border-gold" placeholder="请输入管理口令" />
      {error ? <p className="mt-3 text-sm text-red-300" role="alert">{error}</p> : null}
      <button type="submit" disabled={loading} className="mt-5 h-12 w-full rounded-control bg-gold px-5 font-medium text-ink transition-transform active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">
        {loading ? "正在验证" : "进入内容后台"}
      </button>
      <p className="mt-4 text-xs leading-5 text-bone/60">请先配置 CASE_ADMIN_PASSWORD 与 CASE_ADMIN_SECRET。</p>
    </form>
  );
}
