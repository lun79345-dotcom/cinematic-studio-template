import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteHeroVideo,
  HeroVideoValidationError,
  updateHeroVideo,
} from "@/lib/hero-video-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function unauthorized() {
  return NextResponse.json({ error: "\u672a\u767b\u5f55" }, { status: 401, headers: noStoreHeaders });
}

function badRequest(error: unknown) {
  const message = error instanceof HeroVideoValidationError
    ? error.message
    : "\u8bf7\u6c42\u683c\u5f0f\u65e0\u6548";
  return NextResponse.json({ error: message }, { status: 400, headers: noStoreHeaders });
}

async function readJson(request: NextRequest) {
  try {
    return await request.json() as unknown;
  } catch {
    throw new HeroVideoValidationError("\u8bf7\u6c42\u4f53\u5fc5\u987b\u662f\u6709\u6548 JSON");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const video = await updateHeroVideo((await params).id, await readJson(request));
    return NextResponse.json(video, { headers: noStoreHeaders });
  } catch (error) {
    return badRequest(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    await deleteHeroVideo((await params).id);
    return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    return badRequest(error);
  }
}
