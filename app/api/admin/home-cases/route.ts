import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getCases } from "@/lib/cases";
import {
  getHomeContent,
  HomeContentValidationError,
  updateHomeCaseSlugs,
} from "@/lib/home-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function unauthorized() {
  return NextResponse.json({ error: "\u672a\u767b\u5f55" }, { status: 401, headers: noStoreHeaders });
}

function badRequest(error: unknown) {
  const message = error instanceof HomeContentValidationError
    ? error.message
    : "\u8bf7\u6c42\u683c\u5f0f\u65e0\u6548";
  return NextResponse.json({ error: message }, { status: 400, headers: noStoreHeaders });
}

async function readSlugs(request: NextRequest) {
  let value: unknown;
  try {
    value = await request.json() as unknown;
  } catch {
    throw new HomeContentValidationError("\u8bf7\u6c42\u4f53\u5fc5\u987b\u662f\u6709\u6548 JSON");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HomeContentValidationError("\u8bf7\u6c42\u4f53\u5fc5\u987b\u662f\u5bf9\u8c61");
  }
  const body = value as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== "slugs") {
    throw new HomeContentValidationError("\u8bf7\u6c42\u4f53\u53ea\u80fd\u5305\u542b slugs");
  }
  return body.slugs;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  const content = await getHomeContent();
  return NextResponse.json({ slugs: content.homeCaseSlugs }, { headers: noStoreHeaders });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const requested = await readSlugs(request);
    if (!Array.isArray(requested) || !requested.every((slug) => typeof slug === "string")) {
      throw new HomeContentValidationError("slugs 必须是字符串数组");
    }
    const publishedSlugs = new Set((await getCases()).map((item) => item.slug));
    const unavailable = requested.filter((slug) => !publishedSlugs.has(slug));
    if (unavailable.length) {
      throw new HomeContentValidationError(`案例不存在或尚未发布：${unavailable.join("、")}`);
    }
    const slugs = await updateHomeCaseSlugs(requested);
    return NextResponse.json({ slugs }, { headers: noStoreHeaders });
  } catch (error) {
    return badRequest(error);
  }
}
