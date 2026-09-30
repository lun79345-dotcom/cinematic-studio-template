import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { createCase, getCases, reorderCases } from "@/lib/cases";
import type { CaseInput } from "@/types/case";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  return NextResponse.json(await getCases({ includeDrafts: true }));
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const action = request.nextUrl.searchParams.get("action");
    if (action && action !== "reorder") {
      throw new Error("不支持的案例操作");
    }
    const value = await request.json() as unknown;
    if (action === "reorder") {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("请求体必须是对象");
      }
      const body = value as Record<string, unknown>;
      const keys = Object.keys(body);
      if (keys.length !== 1 || keys[0] !== "slugs") {
        throw new Error("请求体只能包含 slugs");
      }
      return NextResponse.json(await reorderCases(body.slugs));
    }
    return NextResponse.json(await createCase(value as CaseInput), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const value = await request.json() as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("请求体必须是对象");
    }
    const body = value as Record<string, unknown>;
    const keys = Object.keys(body);
    if (keys.length !== 1 || keys[0] !== "slugs") {
      throw new Error("请求体只能包含 slugs");
    }
    return NextResponse.json(await reorderCases(body.slugs));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "更新顺序失败" }, { status: 400 });
  }
}
