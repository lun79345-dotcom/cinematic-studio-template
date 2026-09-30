import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  deleteService,
  HomeContentValidationError,
  updateService,
} from "@/lib/home-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function unauthorized() {
  return NextResponse.json({ error: "\u672a\u767b\u5f55" }, { status: 401, headers: noStoreHeaders });
}

function errorResponse(error: unknown) {
  if (!(error instanceof HomeContentValidationError)) {
    console.error("service API failed", error);
    return NextResponse.json({ error: "服务数据操作失败" }, { status: 500, headers: noStoreHeaders });
  }
  return NextResponse.json({ error: error.message }, { status: 400, headers: noStoreHeaders });
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
    const service = await updateService((await params).id, await readJson(request));
    return NextResponse.json(service, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    await deleteService((await params).id);
    return new NextResponse(null, { status: 204, headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
