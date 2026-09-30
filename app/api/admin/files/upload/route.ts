import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  MAX_PUBLIC_UPLOAD_BYTES,
  PublicFileError,
  uploadPublicFile,
} from "@/lib/public-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "未登录" }, { status: 401, headers });
  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_PUBLIC_UPLOAD_BYTES + 1024 * 1024) {
      throw new PublicFileError("文件不能超过 120MB", 413);
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new PublicFileError("请选择要上传的文件");
    const asset = await uploadPublicFile(file, form.get("path") ?? "uploads", form.get("purpose") ?? undefined);
    return NextResponse.json({ asset, url: asset.url }, { status: 201, headers });
  } catch (error) {
    if (error instanceof PublicFileError) {
      return NextResponse.json({ error: error.message, usages: error.usages }, { status: error.status, headers });
    }
    console.error("public file upload failed", error);
    return NextResponse.json({ error: "上传文件失败" }, { status: 500, headers });
  }
}
