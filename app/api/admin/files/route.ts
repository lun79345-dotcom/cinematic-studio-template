import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createPublicFolder,
  listPublicDirectory,
  PublicFileError,
} from "@/lib/public-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

function errorResponse(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "请求 JSON 格式无效" }, { status: 400, headers });
  }
  if (error instanceof PublicFileError) {
    return NextResponse.json({ error: error.message, usages: error.usages }, { status: error.status, headers });
  }
  console.error("public files API failed", error);
  return NextResponse.json({ error: "公共文件操作失败" }, { status: 500, headers });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "未登录" }, { status: 401, headers });
  try {
    return NextResponse.json(
      await listPublicDirectory(request.nextUrl.searchParams.get("path") ?? ""),
      { headers },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "未登录" }, { status: 401, headers });
  try {
    const body = await request.json() as { path?: unknown; name?: unknown };
    const createdPath = await createPublicFolder(body.path ?? "", body.name);
    return NextResponse.json({ path: createdPath }, { status: 201, headers });
  } catch (error) {
    return errorResponse(error);
  }
}
