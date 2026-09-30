import { NextRequest, NextResponse } from "next/server";
import {
  isPublicCourseAssetPath,
  publicCourseSourceUrl,
} from "@/lib/public-course-source";

export const dynamic = "force-dynamic";

const SUPPORTED_IMAGE_EXTENSION = /\.(?:avif|gif|jpe?g|png|webp)$/i;

function isSafeCourseCoverPath(value: string) {
  return (
    isPublicCourseAssetPath(value) &&
    !value.includes("..") &&
    !value.includes("\\") &&
    !value.includes("?") &&
    !value.includes("#") &&
    SUPPORTED_IMAGE_EXTENSION.test(value)
  );
}

export async function GET(request: NextRequest) {
  const sourcePath = request.nextUrl.searchParams.get("src") || "";
  if (!isSafeCourseCoverPath(sourcePath)) {
    return NextResponse.json({ error: "Invalid course cover path." }, { status: 400 });
  }

  try {
    const upstream = await fetch(publicCourseSourceUrl(sourcePath), {
      cache: "no-store",
      headers: { Accept: "image/avif,image/webp,image/*" },
      method: "GET",
    });
    const contentType = upstream.headers.get("content-type") || "";

    if (!upstream.ok || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Course cover not found." }, { status: 404 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Cache-Control": upstream.headers.get("cache-control") || "public, max-age=3600",
        "Content-Type": contentType,
      },
      status: 200,
    });
  } catch {
    return NextResponse.json({ error: "Course cover service is unavailable." }, { status: 502 });
  }
}
