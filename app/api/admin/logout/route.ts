import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { BASE_PATH } from "@/lib/base-path";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: BASE_PATH || "/", maxAge: 0 });
  return response;
}
