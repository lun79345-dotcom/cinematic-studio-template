import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createPublicFolder,
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
    if (!(file instanceof File)) throw new PublicFileError("请选择图片");
    try {
      await createPublicFolder("uploads", "cases");
    } catch (error) {
      if (!(error instanceof PublicFileError) || error.status !== 409) throw error;
    }
    const asset = await uploadPublicFile(file, "uploads/cases", "image");
    return NextResponse.json({ url: asset.url }, { headers });
  } catch (error) {
    if (error instanceof PublicFileError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }
    console.error("legacy upload failed", error);
    return NextResponse.json({ error: "上传图片失败" }, { status: 500, headers });
  }
}
