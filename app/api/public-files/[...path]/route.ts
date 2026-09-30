import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextRequest } from "next/server";
import { getPublicUploadForRead, PublicFileError } from "@/lib/public-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

function parseRange(value: string | null, size: number) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return false;

  let start: number;
  let end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return false;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
    return false;
  }
  return { start, end: Math.min(end, size - 1) };
}

async function serve(request: NextRequest, context: RouteContext, headOnly: boolean) {
  try {
    const requestedPath = (await context.params).path.join("/");
    const file = await getPublicUploadForRead(requestedPath);
    const range = parseRange(request.headers.get("range"), file.size);
    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": file.mime,
      "Last-Modified": file.modifiedAt.toUTCString(),
      "X-Content-Type-Options": "nosniff",
    });

    if (range === false) {
      headers.set("Content-Range", `bytes */${file.size}`);
      return new Response(null, { status: 416, headers });
    }

    const start = range?.start ?? 0;
    const end = range?.end ?? file.size - 1;
    headers.set("Content-Length", String(Math.max(0, end - start + 1)));
    if (range) headers.set("Content-Range", `bytes ${start}-${end}/${file.size}`);
    const body = headOnly
      ? null
      : Readable.toWeb(createReadStream(file.absolutePath, { start, end })) as ReadableStream;
    return new Response(body, { status: range ? 206 : 200, headers });
  } catch (error) {
    if (error instanceof PublicFileError) {
      return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("public upload read failed", error);
    return Response.json({ error: "文件读取失败" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return serve(request, context, false);
}

export function HEAD(request: NextRequest, context: RouteContext) {
  return serve(request, context, true);
}
