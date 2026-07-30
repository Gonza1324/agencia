import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasPublicSupabaseEnv } from "@/lib/env";
import type { CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database";

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
  let isOwnerAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    isOwnerAdmin =
      profile?.role === "owner_admin" && profile.status === "active";
  }

  if ((!user || !isOwnerAdmin) && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    if (user) {
      redirectUrl.searchParams.set("reason", "unauthorized");
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isOwnerAdmin && request.nextUrl.pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
