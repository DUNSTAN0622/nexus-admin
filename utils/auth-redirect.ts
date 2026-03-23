export const DEFAULT_AUTH_REDIRECT = "/dashboard";

const AUTH_ROUTE_PATHS = new Set(["/login", "/register"]);

export function normalizePathname(pathname: string) {
  if (pathname === "/") return pathname;

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function buildRedirectPath(pathname: string, search = "") {
  return `${normalizePathname(pathname)}${search}`;
}

export function getSafeRedirectPath(candidate: string | null | undefined) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(candidate, "http://localhost");
    const pathname = normalizePathname(url.pathname);

    if (AUTH_ROUTE_PATHS.has(pathname)) {
      return null;
    }

    return `${pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
