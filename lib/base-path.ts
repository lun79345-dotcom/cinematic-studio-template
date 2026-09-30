const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const BASE_PATH = configuredBasePath
  ? `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`
  : "";

/** Prefix an application-owned absolute URL without changing external URLs. */
export function withBasePath(url: string) {
  if (!BASE_PATH || !url || !url.startsWith("/") || url.startsWith("//")) return url;
  if (url === BASE_PATH || url.startsWith(`${BASE_PATH}/`)) return url;
  return `${BASE_PATH}${url}`;
}
