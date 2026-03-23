import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  buildRedirectPath,
  DEFAULT_AUTH_REDIRECT,
  getSafeRedirectPath,
  normalizePathname,
} from "@/utils/auth-redirect";

const PUBLIC_AUTH_ROUTES = new Set(["/login", "/register"]);
const PROTECTED_ROUTE_PREFIXES = ["/dashboard"];

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }

  return target;
}

function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or Supabase publishable/anon key.",
    );
  }

  return { supabaseUrl, supabasePublishableKey };
}

export async function proxy(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);
  const nextParam = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { supabaseUrl, supabasePublishableKey } = getSupabaseCredentials();

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          request.cookies.set({
            name: cookie.name,
            value: cookie.value,
          });
        }

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        for (const cookie of cookiesToSet) {
          response.cookies.set(cookie);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  response.headers.set("Cache-Control", "private, no-store");

  const isAuthenticated = Boolean(user);
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.has(pathname);

  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      buildRedirectPath(pathname, request.nextUrl.search),
    );
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set("Cache-Control", "private, no-store");

    return copyResponseCookies(response, redirectResponse);
  }

  if (isAuthenticated && isPublicAuthRoute) {
    const redirectTarget = nextParam ?? DEFAULT_AUTH_REDIRECT;
    const redirectResponse = NextResponse.redirect(
      new URL(redirectTarget, request.url),
    );
    redirectResponse.headers.set("Cache-Control", "private, no-store");

    return copyResponseCookies(response, redirectResponse);
  }

  return response;
}

export const config = {
  matcher: ["/login", "/register", "/dashboard", "/dashboard/:path*"],
};
