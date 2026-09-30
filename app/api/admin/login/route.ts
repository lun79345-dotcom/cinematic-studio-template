import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminPassword, getSessionToken } from "@/lib/admin-auth";
import { BASE_PATH } from "@/lib/base-path";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configuredPassword = getAdminPassword();
  if (!configuredPassword) {
    return NextResponse.json({ error: "请配置 CASE_ADMIN_PASSWORD 与 CASE_ADMIN_SECRET" }, { status: 503 });
  }

  const body = (await request.json()) as { password?: string };
  if (body.password !== configuredPassword) {
    return NextResponse.json({ error: "口令不正确" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, getSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: BASE_PATH || "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
