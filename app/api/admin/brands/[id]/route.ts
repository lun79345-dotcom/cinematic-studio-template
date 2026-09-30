import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteBrand,
  HomeContentValidationError,
  updateBrand,
} from "@/lib/home-content";
import { normalizePublicLogo, PublicFileError } from "@/lib/public-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function unauthorized() {
  return NextResponse.json({ error: "\u672a\u767b\u5f55" }, { status: 401, headers: noStoreHeaders });
}

function badRequest(error: unknown) {
  if (error instanceof PublicFileError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: noStoreHeaders });
  }
  const message = error instanceof HomeContentValidationError
    ? error.message
    : "\u8bf7\u6c42\u683c\u5f0f\u65e0\u6548";
  return NextResponse.json({ error: message }, { status: 400, headers: noStoreHeaders });
}

async function readJson(request: NextRequest) {
  try {
    return await request.json() as unknown;
  } catch {
    throw new HomeContentValidationError("\u8bf7\u6c42\u4f53\u5fc5\u987b\u662f\u6709\u6548 JSON");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const input = await readJson(request);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new HomeContentValidationError("请求体必须是对象");
    }
    const body = input as Record<string, unknown>;
    const logo = await normalizePublicLogo(body.logo);
    const brand = await updateBrand((await params).id, { ...body, logo });
    return NextResponse.json(brand, { headers: noStoreHeaders });
  } catch (error) {
    return badRequest(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    await deleteBrand((await params).id);
    return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    return badRequest(error);
  }
}
