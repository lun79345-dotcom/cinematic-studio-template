import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deletePublicItem,
  PublicFileError,
  renamePublicItem,
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
  console.error("public file item API failed", error);
  return NextResponse.json({ error: "公共文件操作失败" }, { status: 500, headers });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "未登录" }, { status: 401, headers });
  try {
    const body = await request.json() as { path?: unknown; name?: unknown; destination?: unknown };
    const itemPath = await renamePublicItem(body.path, body.name, body.destination);
    return NextResponse.json({ path: itemPath }, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "未登录" }, { status: 401, headers });
  try {
    await deletePublicItem(request.nextUrl.searchParams.get("path"));
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}
