import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database.types";
import { AUTH_COOKIE_NAME, type AuthUserSession } from "@/lib/constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Middleware that refreshes the Supabase user session, verifies authentication,
 * redirects unauthenticated users hitting root (/) or protected paths to /login,
 * and guards the administrative portal (/admin) specifically for admin roles.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // 1. Check custom AMVI session cookie (used for password/admin and quick session tracking)
  const amviCookie = request.cookies.get(AUTH_COOKIE_NAME);
  let amviSession: AuthUserSession | null = null;
  if (amviCookie?.value) {
    try {
      amviSession = JSON.parse(amviCookie.value) as AuthUserSession;
    } catch {
      amviSession = null;
    }
  }

  // 2. Refresh Supabase session if configured
  let supabaseUser = null;
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    supabaseUser = data.user;
  }

  const isAuthenticated = Boolean(amviSession || supabaseUser);
  const isAdmin = amviSession?.role === "admin" || supabaseUser?.email === "admin@gmail.com";

  // Publicly exempt paths (do not require login)
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/auth");

  // If already authenticated and accessing /login, redirect appropriately
  if (isAuthRoute && pathname === "/login" && isAuthenticated) {
    const target = isAdmin ? "/admin" : "/";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // If path is an auth route, let request proceed
  if (isAuthRoute) {
    return supabaseResponse;
  }

  // Enforce mandatory authentication on root / and all collector/admin pages:
  // If user is unauthenticated, redirect to /login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Enforce Admin portal guard (/admin requires admin role)
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}
