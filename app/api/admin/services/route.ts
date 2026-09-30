import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createService,
  getHomeContent,
  HomeContentValidationError,
  reorderServices,
} from "@/lib/home-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function unauthorized() {
  return NextResponse.json({ error: "\u672a\u767b\u5f55" }, { status: 401, headers: noStoreHeaders });
}

function errorResponse(error: unknown) {
  if (!(error instanceof HomeContentValidationError)) {
    console.error("services API failed", error);
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

function readOrderBody(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HomeContentValidationError("\u8bf7\u6c42\u4f53\u5fc5\u987b\u662f\u5bf9\u8c61");
  }
  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== "ids") {
    throw new HomeContentValidationError("\u8bf7\u6c42\u4f53\u53ea\u80fd\u5305\u542b ids");
  }
  return body.ids;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const content = await getHomeContent();
    return NextResponse.json(content.services, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const action = request.nextUrl.searchParams.get("action");
    if (action && action !== "reorder") {
      throw new HomeContentValidationError("不支持的服务操作");
    }
    const body = await readJson(request);
    if (action === "reorder") {
      const services = await reorderServices(readOrderBody(body));
      return NextResponse.json(services, { headers: noStoreHeaders });
    }
    const service = await createService(body);
    return NextResponse.json(service, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const services = await reorderServices(readOrderBody(await readJson(request)));
    return NextResponse.json(services, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
