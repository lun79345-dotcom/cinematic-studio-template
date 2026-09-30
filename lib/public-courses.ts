import type { PublicCourse, PublicCoursesResponse } from "@/types/public-course";
import { withBasePath } from "@/lib/base-path";

function isPublicCourse(value: unknown): value is PublicCourse {
  if (!value || typeof value !== "object") return false;

  const course = value as Partial<PublicCourse>;
  return (
    typeof course.id === "string" &&
    typeof course.slug === "string" &&
    typeof course.title === "string" &&
    typeof course.price === "number" &&
    typeof course.originalPrice === "number" &&
    typeof course.cover === "string" &&
    Array.isArray(course.outcomes) &&
    Array.isArray(course.lessons)
  );
}

export function parsePublicCoursesResponse(payload: unknown) {
  const courses = (payload as Partial<PublicCoursesResponse>)?.courses;
  if (!Array.isArray(courses) || !courses.every(isPublicCourse)) {
    throw new Error("Public courses response has an unexpected shape");
  }

  return courses;
}

export async function getPublicCourses(signal?: AbortSignal) {
  const response = await fetch(withBasePath("/api/public-courses"), {
    headers: { Accept: "application/json" },
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Public courses request failed with status ${response.status}`);
  }

  return parsePublicCoursesResponse(await response.json());
}
