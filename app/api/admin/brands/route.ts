import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import {
  createBrand,
  getHomeContent,
  HomeContentValidationError,
  reorderBrands,
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
  const content = await getHomeContent();
  return NextResponse.json(content.brands, { headers: noStoreHeaders });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const action = request.nextUrl.searchParams.get("action");
    if (action && action !== "reorder") {
      throw new HomeContentValidationError("不支持的品牌操作");
    }
    const input = await readJson(request);
    if (action === "reorder") {
      const brands = await reorderBrands(readOrderBody(input));
      return NextResponse.json(brands, { headers: noStoreHeaders });
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new HomeContentValidationError("请求体必须是对象");
    }
    const body = input as Record<string, unknown>;
    const logo = await normalizePublicLogo(body.logo);
    const brand = await createBrand({ ...body, logo });
    return NextResponse.json(brand, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return badRequest(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const brands = await reorderBrands(readOrderBody(await readJson(request)));
    return NextResponse.json(brands, { headers: noStoreHeaders });
  } catch (error) {
    return badRequest(error);
  }
}
