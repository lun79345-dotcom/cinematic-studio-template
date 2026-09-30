import { NextResponse } from "next/server";
import { parsePublicCoursesResponse } from "@/lib/public-courses";
import { PUBLIC_COURSES_ORIGIN, publicCourseSourceUrl } from "@/lib/public-course-source";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!PUBLIC_COURSES_ORIGIN) return NextResponse.json({ courses: [] });
  try {
    const upstream = await fetch(publicCourseSourceUrl("/api/public/catalog"), {
      cache: "no-store",
      headers: { Accept: "application/json" },
      method: "GET",
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Course service is unavailable." }, { status: 502 });
    }

    const courses = parsePublicCoursesResponse(await upstream.json());
    return NextResponse.json(
      { courses },
      { headers: { "Cache-Control": upstream.headers.get("cache-control") || "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ error: "Course service is unavailable." }, { status: 502 });
  }
}
