import { BASE_PATH } from "@/lib/base-path";

const DEFAULT_SITE_ORIGIN = "http://localhost:3000";

function normalizeOrigin(value: string) {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("SITE_ORIGIN must use http or https.");
  }

  return url.origin;
}

export const SITE_ORIGIN = normalizeOrigin(process.env.SITE_ORIGIN?.trim() || DEFAULT_SITE_ORIGIN);
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

export function absoluteSiteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const pathWithBase = !BASE_PATH || normalizedPath === BASE_PATH || normalizedPath.startsWith(`${BASE_PATH}/`)
    ? normalizedPath
    : normalizedPath === "/"
      ? BASE_PATH
      : `${BASE_PATH}${normalizedPath}`;

  return new URL(pathWithBase || "/", `${SITE_ORIGIN}/`).toString();
}
