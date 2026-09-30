import { NextRequest, NextResponse } from "next/server";
import { LeadValidationError, createLead } from "@/lib/leads";
import { getSiteSettings } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (process.env.CONTACT_FORM_ENABLED !== "true") return NextResponse.json({ error: "演示模板：联系表单尚未启用。Demo template: contact form is not enabled." }, { status: 503 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 24_000) {
    return NextResponse.json({ error: "提交内容过长" }, { status: 413 });
  }

  try {
    const settings = await getSiteSettings();
    const lead = await createLead(await request.json(), settings.contact.leadNotificationEmails);
    return NextResponse.json(
      { ok: true, id: lead.id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof LeadValidationError) {
      return NextResponse.json(
        { error: error instanceof LeadValidationError ? error.message : "提交内容格式无效" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "暂时无法提交，请稍后重试" }, { status: 500 });
  }
}
