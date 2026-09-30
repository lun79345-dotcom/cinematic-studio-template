import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { deleteCase, updateCase } from "@/lib/cases";
import { removeHomeCaseSlug, replaceHomeCaseSlug } from "@/lib/home-content";
import type { CaseInput } from "@/types/case";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    const updated = await updateCase((await params).slug, (await request.json()) as CaseInput);
    if (updated.slug !== (await params).slug) await replaceHomeCaseSlug((await params).slug, updated.slug);
    if (!updated.published) await removeHomeCaseSlug(updated.slug);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "未登录" }, { status: 401 });
  try {
    await deleteCase((await params).slug);
    await removeHomeCaseSlug((await params).slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "删除失败" }, { status: 400 });
  }
}
