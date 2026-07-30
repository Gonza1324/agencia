import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasPublicSupabaseEnv } from "@/lib/env";
import type { CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types/domain";

const publicRoutes = ["/login"];

type CookiesToSet = {
  name: string;
  value: string;
  options: CookieOptions;
}[];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (request.nextUrl.pathname === "/api/health") {
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasPublicSupabaseEnv() || !url || !anonKey) {
    return NextResponse.json(
      { error: "La aplicación no tiene configurada la conexión a Supabase." },
      { status: 503 },
    );
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = publicRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`),
  );
  let activeRole: UserRole | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.status === "active") {
      activeRole = profile.role as UserRole;
    }
  }

  if ((!user || !activeRole) && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    if (user) {
      redirectUrl.searchParams.set("reason", "unauthorized");
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (user && activeRole && request.nextUrl.pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      activeRole === "subagent" ? "/mi-cuenta" : "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  const pathname = request.nextUrl.pathname;
  const isSubagentRoute =
    pathname === "/" || pathname.startsWith("/mi-cuenta");
  const isViewerRoute =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/reportes");
  const isOwnerRoute = pathname.startsWith("/configuracion");

  if (
    (activeRole === "subagent" && !isSubagentRoute) ||
    (activeRole !== "subagent" && pathname.startsWith("/mi-cuenta")) ||
    (activeRole === "viewer" && !isViewerRoute) ||
    (activeRole === "cash_operator" && isOwnerRoute)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      activeRole === "subagent" ? "/mi-cuenta" : "/dashboard";
    redirectUrl.searchParams.set("reason", "forbidden");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
